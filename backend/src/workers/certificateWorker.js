import PDFDocument from 'pdfkit';
import cloudinary from '../config/cloudinary.js';
import HackathonRegistration from '../models/HackathonRegistration.js';
import Hackathon from '../models/Hackathon.js';
import User from '../models/User.js';
import notificationManager from '../services/notificationService.js';

class CertificateWorker {
  
  async processCertificates(hackathonId, io = null) {
    try {
      const hackathon = await Hackathon.findById(hackathonId);
      if (!hackathon) throw new Error('Hackathon not found');

      const registrations = await HackathonRegistration.find({
        hackathon: hackathonId,
        checkedIn: true,
        certificateIssued: false
      }).populate('user');

      console.log(`[CertificateWorker] Found ${registrations.length} checked-in users for hackathon ${hackathonId}. Starting generation...`);

      for (const reg of registrations) {
        try {
          const user = reg.user;
          if (!user) continue;
          
          const pdfBuffer = await this.generateCertificatePdf(user, hackathon);
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'hackathon_certificates',
                resource_type: 'raw',
                format: 'pdf',
                public_id: `cert_${hackathonId}_${user._id}`
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(pdfBuffer);
          });

          reg.certificateUrl = uploadResult.secure_url;
          reg.certificateIssued = true;
          await reg.save();
          await notificationManager.notify({
            recipientId: user._id,
            type: 'certificate_ready',
            message: `Your participation certificate for "${hackathon.title}" is ready to download!`,
            link: uploadResult.secure_url,
            relatedId: hackathon._id,
          }, io).catch(err => console.error('[CertificateWorker] Notification failed:', err.message));

          console.log(`[CertificateWorker] Issued certificate for ${user.name}`);
        } catch (err) {
          console.error(`[CertificateWorker] Error generating for user ${reg.user?._id}:`, err);
        }
      }
      
      console.log(`[CertificateWorker] Completed certificate generation for ${hackathonId}`);
    } catch (err) {
      console.error('[CertificateWorker] Fatal error:', err);
    }
  }

  async generateCertificatePdf(user, hackathon) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          layout: 'landscape',
          size: 'A4',
        });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#3b82f6');

        doc.fillColor('#000000')
           .fontSize(40)
           .text('Certificate of Participation', 0, 150, { align: 'center' });

        doc.fontSize(20)
           .text('This is to certify that', 0, 220, { align: 'center' });

        doc.fillColor('#3b82f6')
           .fontSize(30)
           .text(user.name || 'Participant', 0, 260, { align: 'center' });

        doc.fillColor('#000000')
           .fontSize(20)
           .text(`has successfully participated in the hackathon`, 0, 310, { align: 'center' });

        doc.fillColor('#eab308')
           .fontSize(25)
           .text(hackathon.title, 0, 350, { align: 'center' });

        doc.fillColor('#000000')
           .fontSize(15)
           .text(`Date: ${new Date(hackathon.timeline.hackathonEnd).toLocaleDateString()}`, 60, doc.page.height - 100)
           .text(`Organizer: ${hackathon.organizer}`, doc.page.width - 300, doc.page.height - 100);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default new CertificateWorker();
