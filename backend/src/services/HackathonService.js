import slugify from '../utils/slugify.js';
import AppError from '../utils/AppError.js';
import CacheService from './CacheService.js';
import CacheKeys from '../utils/CacheKeys.js';
import HackathonRepository from '../repositories/HackathonRepository.js';
import HackathonQueryBuilder from '../strategies/HackathonFilterStrategy.js';
class HackathonService {

  async listHackathons(params = {}) {
    const rawLimit = Math.min(Number(params.limit) || 20, 50);
    const { page = 1, sort = 'createdAt' } = params;
    const limit = rawLimit;

    const cacheKey = CacheKeys.hackathonList(params);
    const cached   = await CacheService.get(cacheKey);
    if (cached) return cached;
    const filter = HackathonQueryBuilder.build(params);
    const sortDoc = HackathonQueryBuilder.buildSort(sort);
    const skip = (page - 1) * limit;

    const [hackathons, total] = await Promise.all([
      HackathonRepository.findMany(filter, {
        sort: sortDoc, skip, limit,
        select: '-faqs -rules -judgingCriteria -resources',
      }),
      HackathonRepository.count(filter),
    ]);

    const result = { hackathons, total, page: Number(page), pages: Math.ceil(total / limit) };
    await CacheService.set(cacheKey, result, 300);
    return result;
  }

  async getBySlug(slug) {
    const cacheKey = CacheKeys.hackathonBySlug(slug);
    const cached   = await CacheService.get(cacheKey);
    if (cached) return cached;

    const hackathon = await HackathonRepository.findBySlug(slug);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    await CacheService.set(cacheKey, hackathon, 300);
    return hackathon;
  }

  async create(organizerId, data) {
    const slug      = slugify(data.title);
    const exists    = await HackathonRepository.findBySlugExists(slug);
    const finalSlug = exists ? `${slug}-${Date.now()}` : slug;

    const hackathon = await HackathonRepository.create({
      ...data,
      slug: finalSlug,
      organizer: organizerId,
      status: data.status || 'draft',
    });

    await CacheService.del(CacheKeys.hackathonListAll());
    return hackathon;
  }

  async update(hackathonId, organizerId, data) {
    const hackathon = data._hackathon || await HackathonRepository.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    if (['completed', 'cancelled'].includes(hackathon.status)) {
      throw new AppError('Cannot modify a completed or cancelled hackathon', 400);
    }

    const { _hackathon, ...safeData } = data;
    Object.assign(hackathon, safeData);
    await HackathonRepository.save(hackathon);
    await CacheService.del(CacheKeys.hackathonBySlug(hackathon.slug));
    return hackathon;
  }

  async softDelete(hackathon) {
    hackathon.deletedAt = new Date();
    hackathon.status    = 'cancelled';
    await HackathonRepository.save(hackathon);
    
    await CacheService.del(CacheKeys.hackathonBySlug(hackathon.slug));
    await CacheService.del(CacheKeys.hackathonListAll());
    return hackathon;
  }

  async assignJudges(hackathonId, organizerId, judgesArray) {
    const hackathon = await HackathonRepository.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);
    if (hackathon.organizer.toString() !== organizerId.toString()) {
      throw new AppError('Only the organizer can assign judges', 403);
    }

    hackathon.judges = judgesArray;
    await HackathonRepository.save(hackathon);
    
    await CacheService.del(CacheKeys.hackathonBySlug(hackathon.slug));
    await CacheService.del(CacheKeys.hackathonListAll());
    
    return hackathon;
  }
}

export default new HackathonService();
