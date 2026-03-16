import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase.js'

const teamsData = [
  {
    sno: 1,
    teamName: 'Team 3',
    collegeName: 'GCET',
    transactionId: 'T2603121009042221897169',
    members: [
      { name: 'G Rithvi Reddy', rollNumber: '25R11A05JV', phoneNumber: '7416777663' },
      { name: 'S Yoshitha', rollNumber: '25R11A05LK', phoneNumber: '7093491597' }
    ]
  },
  {
    sno: 2,
    teamName: 'Chaos Crew',
    collegeName: 'GCET',
    transactionId: '6301972568@fam',
    members: [
      { name: 'Y.Sujanasri', rollNumber: '25R11A05LU', phoneNumber: '6301972568' },
      { name: 'P.Sreenidhi', rollNumber: '25R11A05LC', phoneNumber: '9381895397' },
      { name: 'K.Deepika', rollNumber: '25R11A05KK', phoneNumber: '9390458472' }
    ]
  },
  {
    sno: 3,
    teamName: 'The Prompt Lab',
    collegeName: 'GCET',
    transactionId: '607222074154.00',
    members: [
      { name: 'Himaja Donepudi', rollNumber: '23R11A05A8', phoneNumber: '9059314979' },
      { name: 'Kommajosyula Shreeya', rollNumber: '23R11A05Q6', phoneNumber: '9100375806' },
      { name: 'Kalasapati Chandrika', rollNumber: '23R11A05B0', phoneNumber: '9393731122' }
    ]
  },
  {
    sno: 4,
    teamName: 'Diksha',
    collegeName: 'GCET',
    transactionId: 'T2603132222538343521883',
    members: [
      { name: 'Venthurla poojitha', rollNumber: '24R11A0599', phoneNumber: '8919272787' },
      { name: 'G.lakshmi surekha', rollNumber: '24R11A0566', phoneNumber: '9441853156' }
    ]
  },
  {
    sno: 5,
    teamName: 'Elite Crew',
    collegeName: 'GCET',
    transactionId: 'T2603131434250269735714',
    members: [
      { name: 'K Gunjana', rollNumber: '23R11A05L0', phoneNumber: '9347685789' },
      { name: 'D Aparna Reddy', rollNumber: '23R11A05K4', phoneNumber: '9182037436' },
      { name: 'T Sathwika', rollNumber: '23R11A05N3', phoneNumber: '9177980555' }
    ]
  },
  {
    sno: 6,
    teamName: 'Code and Co.',
    collegeName: 'GCET',
    transactionId: 'T2603131309148075147053',
    members: [
      { name: 'Ramya V', rollNumber: '24R11A05F0', phoneNumber: '8143713213' },
      { name: 'YSD Lavanya', rollNumber: '24R11A05F2', phoneNumber: '+91 80742 28653' }
    ]
  },
  {
    sno: 7,
    teamName: 'Leo',
    collegeName: 'GCET',
    transactionId: 'T2603121258041814953401',
    members: [
      { name: 'Layavardhan', rollNumber: '24R11A0563', phoneNumber: '8374820084' }
    ]
  },
  {
    sno: 8,
    teamName: 'Charizard',
    collegeName: 'GCET',
    transactionId: '1405152887 09',
    members: [
      { name: 'Abhiram Rangoju', rollNumber: '24R11A67D6', phoneNumber: '9949666730' },
      { name: 'G.Chakravardhan Reddy', rollNumber: '24R11A67B7', phoneNumber: '7731031140' }
    ]
  },
  {
    sno: 9,
    teamName: 'Pixel Pirates',
    collegeName: 'GCET',
    transactionId: 'JIOM18813c8471fc011f1861f9ae265c503',
    members: [
      { name: 'Marupaka Abhiram', rollNumber: '24R11A0577', phoneNumber: '8328680549' },
      { name: 'Gogineni Asher', rollNumber: '24R11A67B7', phoneNumber: '9398216877' },
      { name: 'G.Varshith Reddy', rollNumber: '24R11A0567', phoneNumber: '9032414501' }
    ]
  },
  {
    sno: 10,
    teamName: 'Sharath',
    collegeName: 'GCET',
    transactionId: 'T2603121252196999903767',
    members: [
      { name: 'Sharath', rollNumber: '24R11A05D9', phoneNumber: '8247227619' },
      { name: 'Sai sree Juhitha', rollNumber: '24R11A6222', phoneNumber: '8247269439' },
      { name: 'Sri Nitya', rollNumber: '24TQ1A6217', phoneNumber: '' }
    ]
  },
  {
    sno: 11,
    teamName: 'Spark3',
    collegeName: 'GCET',
    transactionId: 'T2603131253035784097237',
    members: [
      { name: 'Relangi Mahathi', rollNumber: '24R11A0590', phoneNumber: '9490469712' },
      { name: 'M .Pooja', rollNumber: '24R11A0579', phoneNumber: '7989113547' },
      { name: 'S .Ubedulla', rollNumber: '24R11A0592', phoneNumber: '9182933023' }
    ]
  },
  {
    sno: 12,
    teamName: 'WeTeamClaude',
    collegeName: 'SNIST',
    transactionId: '120073698332.00',
    members: [
      { name: 'Abhinav', rollNumber: '23311A05Y1', phoneNumber: '9494890250' },
      { name: 'Trishul', rollNumber: '23311A05T5', phoneNumber: '9848150515' }
    ]
  },
  {
    sno: 13,
    teamName: 'Team harsha',
    collegeName: 'GCET',
    transactionId: 'T2603152237593436775233',
    members: [
      { name: 'A.Sri Harsha', rollNumber: '24R11A05BE', phoneNumber: '8639721142' },
      { name: 'Y.Poojitha', rollNumber: '24R11A05BE', phoneNumber: '7013604684' }
    ]
  },
  {
    sno: 14,
    teamName: 'Techno Sphere',
    collegeName: 'GCET',
    transactionId: 'T2603161047443021213868',
    members: [
      { name: 'K.Bhuvan', rollNumber: '24R11A05C6', phoneNumber: '9177250140' },
      { name: 'J.Sathyajith Reddy', rollNumber: '24R11A05H2', phoneNumber: '9849103661' },
      { name: 'S.Harshavardhan', rollNumber: '24R11A05F1', phoneNumber: '7569508070' }
    ]
  }
]

function normalizePhone(phone) {
  const cleaned = String(phone || '').trim().replace(/\s+/g, '')
  return cleaned || '0000000000'
}

async function main() {
  const created = []
  const synced = []
  const failed = []

  for (const item of teamsData) {
    const teamName = item.teamName.trim()
    const password = `${teamName}@${item.sno}`

    try {
      const { data: existing } = await supabase
        .from('teams')
        .select('id')
        .eq('team_name', teamName)
        .single()

      const hash = await bcrypt.hash(password, 10)
      let team = null
      let teamErr = null

      if (existing) {
        const { data, error } = await supabase
          .from('teams')
          .update({
            password_hash: hash,
            role: 'team',
            status: 'approved',
            transaction_id: item.transactionId || null
          })
          .eq('id', existing.id)
          .select('id, team_name')
          .single()
        team = data
        teamErr = error
      } else {
        const { data, error } = await supabase
          .from('teams')
          .insert({
            team_name: teamName,
            password_hash: hash,
            role: 'team',
            status: 'approved',
            transaction_id: item.transactionId || null
          })
          .select('id, team_name')
          .single()
        team = data
        teamErr = error
      }

      if (teamErr || !team) {
        failed.push({ teamName, reason: teamErr?.message || 'team insert failed' })
        continue
      }

      // Replace member list exactly as provided in source sheet.
      const { error: deleteMemberErr } = await supabase.from('members').delete().eq('team_id', team.id)
      if (deleteMemberErr) {
        failed.push({ teamName, reason: deleteMemberErr.message || 'members delete failed' })
        continue
      }

      const memberRows = item.members.map(m => ({
        team_id: team.id,
        name: String(m.name || '').trim(),
        roll_number: String(m.rollNumber || '').trim(),
        college_name: String(item.collegeName || 'Unknown College').trim(),
        phone_number: normalizePhone(m.phoneNumber),
        // Legacy columns kept for compatibility in DBs that have not dropped them yet.
        branch: 'CSE',
        year: 'N/A',
        section: 'NA'
      }))

      const { error: memberErr } = await supabase.from('members').insert(memberRows)
      if (memberErr) {
        failed.push({ teamName, reason: memberErr.message || 'members insert failed after delete' })
        continue
      }

      await supabase.from('leaderboard').upsert({
        team_id: team.id,
        team_name: team.team_name,
        round1_score: 0,
        round2_score: 0,
        round3_score: 0,
        total_score: 0
      })

      if (existing) synced.push({ teamName, password })
      else created.push({ teamName, password })
    } catch (err) {
      failed.push({ teamName, reason: err?.message || 'unexpected error' })
    }
  }

  console.log('\n=== Team Sync Summary ===')
  console.log(`Created: ${created.length}`)
  console.log(`Synced : ${synced.length}`)
  console.log(`Failed : ${failed.length}`)

  if (created.length) {
    console.log('\nCreated Teams + Passwords:')
    for (const row of created) {
      console.log(`- ${row.teamName} -> ${row.password}`)
    }
  }

  if (synced.length) {
    console.log('\nSynced Teams + Passwords:')
    for (const row of synced) {
      console.log(`- ${row.teamName} -> ${row.password}`)
    }
  }

  if (failed.length) {
    console.log('\nFailed:')
    for (const row of failed) {
      console.log(`- ${row.teamName}: ${row.reason}`)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
