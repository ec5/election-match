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

const convertDateString = (s) => {
  return s.split('/').reverse().join('')
}

const buildMotionId = ({meeting, vote, meetingIndex}) => {
  assert(vote['vote-date'].length === 1)
  assert(vote['vote-time'].length === 1)
  const meetingTypeCode = meeting.$.type.replace(/\W*(\w)\w*/g, '$1').toLowerCase()
  return _.join([
    meetingTypeCode,
    convertDateString(meeting.$['start-date']),
    meetingIndex,
    vote.$.number,
    convertDateString(vote['vote-date'][0]) + vote['vote-time'][0].replace(/:/g, ''),
  ], '_')
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
        assert(vote['motion-ch'].length === 1)
        // assert(meeting.$['start-date'] === vote['vote-date'][0], [meeting.$['start-date'], vote['vote-date']])

        const motionId = buildMotionId({meeting, vote, meetingIndex: i})
        assert(!motions[motionId], `motion ${motionId} duplicated`)
        const meetingType = meeting.$.type
        const voteDate = vote['vote-date'][0]
        motions[motionId] = {
          meetingType,
          voteDate,
          title: vote['motion-ch'][0],
        }
        _.each(vote['individual-votes'][0].member, (member) => {
          assert(member.vote.length === 1, member.vote)
          const keyPath = [member.$['name-ch'], 'votes', motionId]
          assert(!_.get(member, keyPath))
          _.set(members, keyPath, member.vote[0].toLowerCase())
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
