import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { encryptMessage, decryptMessage } from '../utils/crypto.js';
import AppError from '../utils/AppError.js';

class MessageService {
  async saveMessage(data) {
    const { sender, receiver, group, text, fileUrl, fileType, fileName, status } = data;

    let encryptionResult = null;
    if (text) {
      encryptionResult = encryptMessage(text);
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      group,
      encryptedMessage: encryptionResult?.encryptedMessage,
      iv: encryptionResult?.iv,
      authTag: encryptionResult?.authTag,
      keyVersion: encryptionResult?.keyVersion,
      messageType: text ? 'text' : (fileUrl ? 'file' : 'system'),
      fileUrl,
      fileType: fileType || 'none',
      fileName,
      status: status || 'sent',
    });

    const populatedMsg = await newMessage.populate('sender', 'name profilePicture');
    const plaintextMessage = populatedMsg.toObject();
    plaintextMessage.text = text;
    delete plaintextMessage.encryptedMessage;
    delete plaintextMessage.iv;
    delete plaintextMessage.authTag;
    delete plaintextMessage.keyVersion;

    return plaintextMessage;
  }
  async getDirectMessages(requestUserId, targetUserId, cursor, limit = 50) {
    if (!mongoose.Types.ObjectId.isValid(requestUserId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new AppError('Invalid user IDs', 400);
    }

    const query = {
      $or: [
        { sender: requestUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: requestUserId },
      ],
    };

    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        throw new AppError('Invalid cursor', 400);
      }
      query._id = { $lt: cursor };
    }
    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .populate('sender', 'name profilePicture');

    const nextCursor = messages.length === Number(limit) ? messages[messages.length - 1]._id : null;
    const decryptedMessages = messages.map(msg => this._decryptMessageDoc(msg)).reverse();

    return {
      data: decryptedMessages,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }
  _decryptMessageDoc(msgDoc) {
    const msg = msgDoc.toObject ? msgDoc.toObject() : { ...msgDoc };
    
    if (msg.encryptedMessage && msg.iv && msg.authTag) {
      try {
        msg.text = decryptMessage(msg.encryptedMessage, msg.iv, msg.authTag, msg.keyVersion);
      } catch (err) {
        msg.text = '[Message cannot be decrypted]';
      }
    } else {
      msg.text = '';
    }
    delete msg.encryptedMessage;
    delete msg.iv;
    delete msg.authTag;
    delete msg.keyVersion;

    return msg;
  }
}

export default new MessageService();
