
class FilterStrategy {
  applies(params) { return false; }
  apply(query, params) {}
}

class CategoryFilter extends FilterStrategy {
  applies({ category }) { return Boolean(category); }
  apply(query, { category }) {
    query.category = { $regex: category, $options: 'i' };
  }
}

class ModeFilter extends FilterStrategy {
  applies({ mode }) { return Boolean(mode); }
  apply(query, { mode }) { query.mode = mode; }
}

class DifficultyFilter extends FilterStrategy {
  applies({ difficulty }) { return Boolean(difficulty); }
  apply(query, { difficulty }) { query.difficulty = difficulty; }
}

class FreeFilter extends FilterStrategy {
  applies({ isFree }) { return isFree !== undefined; }
  apply(query, { isFree }) { query.isFree = isFree === 'true'; }
}

class SkillsFilter extends FilterStrategy {
  applies({ skills }) { return Boolean(skills); }
  apply(query, { skills }) {
    const skillsArr = Array.isArray(skills) ? skills : [skills];
    query.skills = { $in: skillsArr };
  }
}

class RegistrationOpenFilter extends FilterStrategy {
  applies({ registrationOpen }) { return registrationOpen === 'true'; }
  apply(query) {
    const now = new Date();
    query['timeline.registrationOpen']  = { $lte: now };
    query['timeline.registrationClose'] = { $gte: now };
  }
}

class SearchFilter extends FilterStrategy {
  applies({ search }) { return Boolean(search); }
  apply(query, { search }) {
    query.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category:    { $regex: search, $options: 'i' } },
    ];
  }
}

class PrizePoolFilter extends FilterStrategy {
  applies({ minPrize }) { return Boolean(minPrize); }
  apply(query, { minPrize }) {
    query['prizes.0.amount'] = { $gte: Number(minPrize) };
  }
}
class StatusFilter extends FilterStrategy {
  applies({ status }) { return Boolean(status); }
  apply(query, { status }) {
    query.status = status;
  }
}

class DateRangeFilter extends FilterStrategy {
  applies({ startDate, endDate }) { return Boolean(startDate) || Boolean(endDate); }
  apply(query, { startDate, endDate }) {
    if (startDate) {
      query['timeline.hackathonStart'] = query['timeline.hackathonStart'] || {};
      query['timeline.hackathonStart'].$gte = new Date(startDate);
    }
    if (endDate) {
      query['timeline.hackathonEnd'] = query['timeline.hackathonEnd'] || {};
      query['timeline.hackathonEnd'].$lte = new Date(endDate);
    }
  }
}

class HackathonQueryBuilder {
  constructor() {
    this.strategies = [
      new CategoryFilter(),
      new ModeFilter(),
      new DifficultyFilter(),
      new FreeFilter(),
      new SkillsFilter(),
      new RegistrationOpenFilter(),
      new SearchFilter(),
      new PrizePoolFilter(),
      new StatusFilter(),
      new DateRangeFilter(),
    ];
  }
  build(params = {}) {
    const query = {
      status:     { $in: ['published', 'ongoing'] },
      visibility: 'public',
      deletedAt:  null,
    };

    for (const strategy of this.strategies) {
      if (strategy.applies(params)) {
        strategy.apply(query, params);
      }
    }

    return query;
  }
  buildSort(sortKey = 'createdAt') {
    const sortMap = {
      createdAt:    { createdAt: -1 },
      prizePool:    { 'prizes.0.amount': -1 },
      deadline:     { 'timeline.registrationClose': 1 },
      closingSoon:  { 'timeline.registrationClose': 1 },
      popular:      { registrationCount: -1 },
      featured:     { isFeatured: -1, registrationCount: -1 },
    };
    return sortMap[sortKey] || { createdAt: -1 };
  }
}

export default new HackathonQueryBuilder();
