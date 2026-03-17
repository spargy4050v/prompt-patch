import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function main() {
  const { data: teams, error: teamErr } = await supabase
    .from('teams')
    .select('id, team_name, status')
    .eq('role', 'team')
    .neq('status', 'approved')

  if (teamErr) {
    console.error('Failed to fetch teams:', teamErr.message)
    process.exit(1)
  }

  const teamIds = (teams || []).map(t => t.id)
  if (teamIds.length === 0) {
    console.log('No non-approved teams found. Nothing to delete.')
    return
  }

  const { data: subs, error: subErr } = await supabase
    .from('round1_submissions')
    .select('id, team_id, score, is_final')
    .in('team_id', teamIds)

  if (subErr) {
    console.error('Failed to fetch round1 submissions:', subErr.message)
    process.exit(1)
  }

  const submissions = subs || []
  if (submissions.length === 0) {
    console.log('No Round 1 submissions for non-approved teams. Nothing to delete.')
    return
  }

  const teamMap = new Map((teams || []).map(t => [t.id, `${t.team_name} (${t.status})`]))
  console.log('Deleting Round 1 submissions for non-approved teams:')
  for (const s of submissions) {
    console.log(`- ${s.id} | ${teamMap.get(s.team_id) || s.team_id} | score=${s.score ?? 'null'} | final=${s.is_final}`)
  }

  const ids = submissions.map(s => s.id)
  const { error: delErr } = await supabase
    .from('round1_submissions')
    .delete()
    .in('id', ids)

  if (delErr) {
    console.error('Delete failed:', delErr.message)
    process.exit(1)
  }

  console.log(`Deleted ${ids.length} Round 1 submission rows.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
