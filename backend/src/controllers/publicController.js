
import User       from '../models/User.js';
import Post       from '../models/Post.js';
import Group      from '../models/Group.js';
import Mentor     from '../models/Mentor.js';
import MentorService from '../models/MentorService.js';
import Hackathon  from '../models/Hackathon.js';
import CacheService from '../services/CacheService.js';
import {
  serializePublicUser,
  serializePublicPost,
  serializePublicMentor,
  serializePublicHackathon,
  serializePublicGroup,
} from '../lib/serializers/public.serializers.js';
import HackathonQueryBuilder from '../strategies/HackathonFilterStrategy.js';

const MAX_LIMIT = 50;

function parsePagination(query) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || 20));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

export const getPublicFeed = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const cacheKey = `public:feed:${page}:${limit}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const posts = await Post.find({ visibility: 'PUBLIC' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name username profilePicture headline')
      .lean();

    const total = await Post.countDocuments({ visibility: 'PUBLIC' });

    const payload = {
      posts: posts.map(serializePublicPost),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    await CacheService.set(cacheKey, payload, 60);
    res.status(200).json(payload);
  } catch (err) {
    console.error('[public/feed]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicMentors = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, minRating, minExperience, sessionType } = req.query;

    const cacheKey = `public:mentors:${JSON.stringify({page, limit, search, minRating, minExperience, sessionType})}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const query = { status: 'approved', isApproved: true };

    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    if (minExperience) {
      query.yearsOfExperience = { $gte: parseInt(minExperience) };
    }

    if (search) {
      const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id').lean();
      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    if (sessionType) {
      const services = await MentorService.find({ title: { $regex: sessionType, $options: 'i' }, isActive: true }).select('mentor').lean();
      const mentorIdsWithService = services.map(s => s.mentor);
      query._id = { $in: mentorIdsWithService };
    }

    const mentors = await Mentor.find(query)
      .sort({ averageRating: -1, totalSessions: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name username profilePicture headline instituteName visibility')
      .lean();

    const total = await Mentor.countDocuments(query);

    const payload = {
      mentors: mentors.map(serializePublicMentor),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    await CacheService.set(cacheKey, payload, 120);
    res.status(200).json(payload);
  } catch (err) {
    console.error('[public/mentors]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicMentorByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `public:mentor:${username}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') }).lean();
    if (!user) return res.status(404).json({ message: 'Mentor not found' });

    let mentor = await Mentor.findOne({ user: user._id, status: 'approved', isApproved: true })
      .populate('user', 'name username profilePicture headline instituteName')
      .lean();

    if (!mentor) {
      mentor = {
        _id: user._id,
        user: user,
        headline: user.headline || 'Member',
        about: user.about || 'No description provided.',
        company: 'N/A',
        role: user.role,
        yearsOfExperience: 0,
        skills: user.skills || [],
        languages: ['English'],
        isApproved: true,
        status: 'approved',
        totalSessions: 0,
        averageRating: 0,
        totalReviews: 0,
      };
    }

    const payload = serializePublicMentor(mentor);
    await CacheService.set(cacheKey, payload, 120);
    res.status(200).json(payload);
  } catch (err) {
    console.error('[public/mentors/:username]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicHackathons = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { sort } = req.query;
    const queryParams = { ...req.query, page, limit };
    const cacheKey = `public:hackathons:${JSON.stringify(queryParams)}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const query = HackathonQueryBuilder.build(req.query);
    const sortDoc = HackathonQueryBuilder.buildSort(sort);

    const hackathons = await Hackathon.find(query)
      .sort(sortDoc)
      .skip(skip)
      .limit(limit)
      .populate('organizer', 'name username profilePicture')
      .lean({ virtuals: true });

    const total = await Hackathon.countDocuments(query);

    const payload = {
      hackathons: hackathons.map(serializePublicHackathon),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    await CacheService.set(cacheKey, payload, 120);
    res.status(200).json(payload);
  } catch (err) {
    console.error('[public/hackathons]', err.stack);
    res.status(500).json({ message: 'Server error', err: err.message, stack: err.stack });
  }
};

export const getPublicHackathonBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `public:hackathon:${slug}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const hackathon = await Hackathon.findOne({
      slug,
      status:    { $in: ['published', 'ongoing'] },
      visibility: 'public',
      deletedAt:  null,
    })
      .populate('organizer', 'name username profilePicture')
      .lean({ virtuals: true });

    if (!hackathon) return res.status(404).json({ message: 'Hackathon not found or not public' });

    const payload = serializePublicHackathon(hackathon);
    await CacheService.set(cacheKey, payload, 120);
    res.status(200).json(payload);
  } catch (err) {
    console.error('[public/hackathons/:slug]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `public:profile:${username}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') }).lean();
    if (!user) return res.status(404).json({ message: 'User not found or is private' });

    const payload = serializePublicUser(user);
    await CacheService.set(cacheKey, payload, 120);
    res.status(200).json(payload);
  } catch (err) {
    console.error('[public/profile/:username]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicPost = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `public:post:${id}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const post = await Post.findOne({ _id: id, visibility: 'PUBLIC' })
      .populate('user', 'name username profilePicture headline')
      .lean();

    if (!post) return res.status(404).json({ message: 'Post not found or is private' });

    const payload = serializePublicPost(post);
    await CacheService.set(cacheKey, payload, 60);
    res.status(200).json(payload);
  } catch (err) {
    console.error('[public/post/:id]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicGroup = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `public:group:${slug}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);
    const group = await Group.findOne({ _id: slug, privacy: 'public' }).lean();
    if (!group) return res.status(404).json({ message: 'Group not found or is private' });

    const payload = serializePublicGroup(group);
    await CacheService.set(cacheKey, payload, 120);
    res.status(200).json(payload);
  } catch (err) {
    console.error('[public/groups/:slug]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSitemapData = async (req, res) => {
  try {
    const cacheKey = 'public:sitemap';
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const [users, posts, hackathons, groups] = await Promise.all([
      User.find({ visibility: 'PUBLIC' }).select('username updatedAt').limit(1000).lean(),
      Post.find({ visibility: 'PUBLIC' }).select('_id updatedAt').limit(1000).lean(),
      Hackathon.find({ status: { $in: ['published', 'ongoing'] }, visibility: 'public', deletedAt: null })
        .select('slug updatedAt').limit(1000).lean(),
      Group.find({ privacy: 'public' }).select('_id updatedAt').limit(1000).lean(),
    ]);

    const payload = {
      users:      users.map(u => ({ username: u.username, updatedAt: u.updatedAt })),
      posts:      posts.map(p => ({ id: p._id, updatedAt: p.updatedAt })),
      hackathons: hackathons.map(h => ({ slug: h.slug, updatedAt: h.updatedAt })),
      groups:     groups.map(g => ({ id: g._id, updatedAt: g.updatedAt })),
    };

    await CacheService.set(cacheKey, payload, 3600);
    res.status(200).json(payload);
  } catch (err) {
    console.error('[public/sitemap]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicDiscover = async (req, res) => {
  try {
    const cacheKey = `public:discover`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const users = await User.find({ visibility: 'PUBLIC' })
      .select('name institute headline profilePicture')
      .limit(10)
      .lean();

    const mentors = await Mentor.find({ status: 'approved', isApproved: true })
      .populate('user', 'name institute headline profilePicture')
      .limit(10)
      .lean();

    const formattedUsers = users.map((u) => ({
      _id: u._id,
      name: u.name,
      institute: u.institute,
      headline: u.headline,
      profilePicture: u.profilePicture,
      status: 'none',
      isMentor: false
    }));

    const formattedMentors = mentors.filter(m => m.user).map((m) => ({
      _id: m.user._id,
      name: m.user.name,
      institute: m.user.institute,
      headline: m.user.headline || m.headline,
      profilePicture: m.user.profilePicture,
      status: 'none',
      isMentor: true
    }));

    const combined = [...formattedUsers, ...formattedMentors].sort(() => Math.random() - 0.5);

    await CacheService.set(cacheKey, combined, 120);
    res.status(200).json(combined);
  } catch (err) {
    console.error('[public/discover]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
