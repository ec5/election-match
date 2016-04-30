import assert from 'assert'
import fs from 'fs'

import _ from 'lodash'
import glob from 'glob'
import jsonfile from 'jsonfile'
import xml2js from 'xml2js'

const parseString = (s) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(s, (err, obj) => {
      if (err) {
        reject(err)
        return
      }
      resolve(obj)
    })
  })
}

async function main() {
  const motions = {}
  const members = {}
  const data = {motions, members}

  const files = glob.sync('data/*.xml')
  await files.reduce(async (p, file) => {
    console.log(file)
    await p
    const content = fs.readFileSync(file, 'utf8')
    const obj = await parseString(content)

    _.each(obj['legcohk-vote']['meeting'], (meeting, i) => {
      _.each(meeting.vote, (vote) => {
        assert(vote['individual-votes'].length === 1, 'individual-votes > 2')
        assert(vote['vote-date'].length === 1)
        assert(vote['motion-ch'].length === 1)
        // assert(meeting.$['start-date'] === vote['vote-date'][0], [meeting.$['start-date'], vote['vote-date']])

        const meetingType = meeting.$.type
        const voteDate = vote['vote-date'][0]
        const motionId = `${meetingType}_${meeting.$['start-date']}_${i}_${vote.$.number}_${voteDate}_${vote['vote-time']}`
        assert(!motions[motionId], `motion ${motionId} duplicated`)
        motions[motionId] = {
          meetingType,
          voteDate,
          title: vote['motion-ch'][0],
        }
        _.each(vote['individual-votes'][0].member, (member) => {
          assert(member.vote.length === 1, member.vote)
          members[member.$['name-ch']] = member.vote[0]
        })
      })
    })
  }, Promise.resolve())

  const filename = 'app/assets/data.json'
  jsonfile.writeFileSync(filename, data, {
    spaces: 2,
  })
}

main().then(() => {
  process.exit(0)
}).catch((err) => {
  console.trace(err)
  process.exit(-1)
})
