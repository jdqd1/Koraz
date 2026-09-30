-- Additive v2 reward kinds. Historical rows, keys and balances are unchanged.
alter table public.learning_rewards drop constraint learning_rewards_reward_kind_check;
alter table public.learning_rewards add constraint learning_rewards_reward_kind_check check (reward_kind in (
  'activity_understand', 'activity_recall', 'activity_check', 'review_applied',
  'unit_completed', 'route_completed', 'milestone_first_activity',
  'milestone_first_unit', 'milestone_first_review',
  'v2_objective_recalled', 'v2_objective_mastered', 'v2_objective_consolidated'
));
