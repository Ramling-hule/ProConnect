
export function serializePublicUser(user) {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  return {
    id:             u._id,
    name:           u.name,
    username:       u.username,
    email:          u.email || `${u.username}@example.com`,
    headline:       u.headline   ?? null,
    about:          u.about      ?? null,
    profilePicture: u.profilePicture ?? '',
    instituteName:  u.instituteName  ?? null,
    skills:         u.skills         ?? [],
    experience:     sanitizeExperience(u.experience ?? []),
    education:      sanitizeEducation(u.education   ?? []),
    badges:         u.badges   ?? [],
    points:         u.points   ?? 0,
    openToWork:     u.openToWork    ?? false,
    openToCompete:  u.openToCompete ?? false,
    createdAt:      u.createdAt,
  };
}
function sanitizeExperience(list) {
  return list.map(e => ({
    title:       e.title       ?? null,
    company:     e.company     ?? null,
    location:    e.location    ?? null,
    startDate:   e.startDate   ?? null,
    endDate:     e.endDate     ?? null,
    description: e.description ?? null,
    current:     e.current     ?? false,
  }));
}
function sanitizeEducation(list) {
  return list.map(e => ({
    school:     e.school     ?? null,
    degree:     e.degree     ?? null,
    field:      e.field      ?? null,
    startDate:  e.startDate  ?? null,
    endDate:    e.endDate    ?? null,
    grade:      e.grade      ?? null,
    activities: e.activities ?? null,
  }));
}

export function serializePublicMentor(mentor) {
  if (!mentor) return null;
  const m = mentor.toObject ? mentor.toObject() : mentor;
  const userPart = m.user && typeof m.user === 'object' ? serializePublicUser(m.user) : null;
  return {
    id:                m._id,
    user:              userPart,
    headline:          m.headline          ?? null,
    about:             m.about             ?? null,
    company:           m.company           ?? null,
    role:              m.role              ?? null,
    yearsOfExperience: m.yearsOfExperience ?? 0,
    skills:            m.skills            ?? [],
    languages:         m.languages         ?? [],
    linkedin:          m.linkedin   ?? null,
    github:            m.github     ?? null,
    portfolio:         m.portfolio  ?? null,
    averageRating: m.averageRating ?? 0,
    totalSessions: m.totalSessions ?? 0,
    totalReviews:  m.totalReviews  ?? 0,
  };
}

export function serializePublicPost(post) {
  if (!post) return null;
  const p = post.toObject ? post.toObject() : post;
  const author = p.user && typeof p.user === 'object' ? {
    id:             p.user._id,
    name:           p.user.name,
    username:       p.user.username,
    profilePicture: p.user.profilePicture ?? '',
    headline:       p.user.headline        ?? null,
  } : null;

  return {
    id:            p._id,
    author,
    text:          p.text  ?? null,
    image:         p.image ?? null,
    media:         p.media ?? null,
    likesCount:    Array.isArray(p.likes)    ? p.likes.length    : (p.likesCount    ?? 0),
    commentsCount: Array.isArray(p.comments) ? p.comments.length : (p.commentsCount ?? 0),
    postType:      p.postType ?? 'regular',
    hackathonMeta: p.hackathonMeta ? {
      hackathonId: p.hackathonMeta.hackathonId ?? null,
      rolesNeeded: p.hackathonMeta.rolesNeeded ?? [],
      techStack:   p.hackathonMeta.techStack   ?? [],
    } : null,
    createdAt:     p.createdAt,
  };
}

export function serializePublicHackathon(hackathon) {
  if (!hackathon) return null;
  const h = hackathon.toObject ? hackathon.toObject({ virtuals: true }) : hackathon;

  const organizer = h.organizer && typeof h.organizer === 'object' ? {
    name:           h.organizer.name,
    username:       h.organizer.username,
    profilePicture: h.organizer.profilePicture ?? '',
  } : null;

  return {
    id:              h._id,
    slug:            h.slug,
    title:           h.title,
    tagline:         h.tagline         ?? null,
    description:     h.description,
    banner:          h.banner          ?? null,
    category:        h.category,
    skills:          h.skills          ?? [],
    mode:            h.mode,
    difficulty:      h.difficulty,
    isFree:          h.isFree,
    registrationFee: h.isFree ? 0 : (h.registrationFee ?? 0),
    currency:        h.currency        ?? 'INR',
    minTeamSize:     h.minTeamSize,
    maxTeamSize:     h.maxTeamSize,
    soloAllowed:     h.soloAllowed,
    registrationCount: h.registrationCount ?? 0,
    maxParticipants:   h.maxParticipants   ?? null,
    timeline:        h.timeline,
    status:          h.status,
    isFeatured:      h.isFeatured       ?? false,
    isRegistrationOpen: h.isRegistrationOpen ?? false,
    tracks:          (h.tracks  ?? []).map(t => ({ name: t.name, description: t.description, skills: t.skills })),
    prizes:          (h.prizes  ?? []).map(p => ({ rank: p.rank, title: p.title, amount: p.amount, description: p.description })),
    sponsors:        (h.sponsors ?? []).map(s => ({ name: s.name, logo: s.logo, tier: s.tier })),
    faqs:            h.faqs    ?? [],
    eligibility:     h.eligibility ?? {},
    organizer,
    createdAt:       h.createdAt,
  };
}

export function serializePublicGroup(group) {
  if (!group) return null;
  const g = group.toObject ? group.toObject() : group;
  return {
    id:          g._id,
    name:        g.name,
    description: g.description ?? null,
    image:       g.image       ?? '',
    institute:   g.institute   ?? null,
    memberCount: Array.isArray(g.members) ? g.members.length : 0,
    createdAt:   g.createdAt,
  };
}
