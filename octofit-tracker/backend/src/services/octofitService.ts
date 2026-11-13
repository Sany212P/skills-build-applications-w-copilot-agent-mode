import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requestError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw requestError('Activity details are required', 400);

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !mongoose.isObjectIdOrHexString(userId) ||
    typeof teamId !== 'string' ||
    !mongoose.isObjectIdOrHexString(teamId)
  ) {
    throw requestError('Valid userId and teamId are required', 400);
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw requestError('Activity type is required', 400);
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw requestError('Activity minutes must be a positive number', 400);
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) throw requestError('Activity user or team was not found', 404);

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw requestError('Team details are required', 400);

  const { name, mascot } = input;
  const members = input.members === undefined ? [] : input.members;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw requestError('Team name is required', 400);
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw requestError('Team mascot is required', 400);
  }
  if (
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !mongoose.isObjectIdOrHexString(member))
  ) {
    throw requestError('Team members must be valid user IDs', 400);
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members,
  });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    { $set: { totalPoints: { $sum: '$activities.points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $project: { _id: 0, teamName: '$name', totalPoints: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw requestError('User was not found', 404);

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1, _id: -1 }).lean(),
    Workout.find().sort({ title: 1 }).lean(),
  ]);
  const goalFocus = user.fitnessGoal?.trim().toLowerCase();
  const goalWorkouts = goalFocus
    ? workouts.filter((workout) => workout.focus.toLowerCase() === goalFocus)
    : [];
  const activityFocus = recentActivity?.type.trim().toLowerCase();
  const activityWorkouts = activityFocus
    ? workouts.filter((workout) => workout.focus.toLowerCase() === activityFocus)
    : [];
  const selectedWorkouts = goalWorkouts.length > 0 ? goalWorkouts : activityWorkouts;
  if (selectedWorkouts.length === 0) return [];

  const focus = selectedWorkouts[0].focus;
  const reason = goalWorkouts.length > 0
    ? `Recommended for your ${user.fitnessGoal} fitness goal${recentActivity ? ` and recent ${recentActivity.type} activity` : ''}.`
    : `Recommended based on your recent ${recentActivity?.type} activity.`;
  return selectedWorkouts.map((workout) => ({ ...workout, focus, reason }));
}

export { User };
