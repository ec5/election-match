/* globals $,moment */
import _ from 'lodash'

import { render } from 'react-dom'
import React from 'react'

let _data = {}
const scoreAdjustment = {
  yes: 1,
  no: 1,
  opposite: -1,
  novote: 0,
}

const onSelectChange = (rootNode, $motionSelect) => (event) => {
  const selectedMotionIds = $motionSelect.val()
  render((
    <form>
      <h2>議案投票</h2>
      <p className="lead">假如你是立法會議員，你會如何投票？</p>
      <div className="list-group">
      {_.map(selectedMotionIds, (motionId, i) => {
        const motion = _data.motions[motionId]
        return (
          <div key={i} className="form-group list-group-item lead">
            <h4 className="list-group-item-heading">{motion.title}</h4>
            <label className="radio-inline">
              <input type="radio" name={motionId} value="yes" /> 贊成
            </label>
            <label className="radio-inline">
              <input type="radio" name={motionId} value="no" /> 反對
            </label>
          </div>
        )
      })}
      </div>
    </form>
  ), rootNode)
}

const getOppositeVote = (vote) => {
  return {
    'yes': 'no',
    'no': 'yes',
  }[vote]
}

const onVoteChange = (rootNode) => (event) => {
  const $form = $(event.target).closest('form')
  const voted = $form.serializeArray()
  // console.log(voted)

  const members = _.sortBy(_.map(_data.members, (member, memberName) => {
    const matching = _.reduce(voted, (r, {name: motionId, value: vote}) => {
      const memberVote = member.votes[motionId]
      if (memberVote === vote) {
        r.score += scoreAdjustment[vote]
        r[vote] += 1
      } else if (memberVote === getOppositeVote(vote)) {
        r.score += scoreAdjustment['opposite']
        r['opposite'] += 1
      } else if (memberVote) {
        r.score += scoreAdjustment['novote']
        r['novote'] += 1
        r[memberVote] += 1
      }
      return r
    }, {
      yes: 0,
      no: 0,
      opposite: 0,
      novote: 0,
      absent: 0,
      present: 0,
      abstain: 0,
      score: 0,
    })
    return {
      name: memberName,
      matching,
    }
  }), (x) => x.matching.score * -1)

  render((
    <div>
      <h3>結果</h3>
      <div className="table-responsive">
        <table className="table table-striped table-hover table-condensed">
          <thead>
            <tr>
              <th>議員</th>
              <th>相似分數</th>
              <th>相同投票</th>
              <th>相反投票</th>
              <th>相同贊成</th>
              <th>相同反對</th>
              <th>沒有表態</th>
            </tr>
          </thead>
          <tbody>
            {_.map(members, (member, i) => {
              return (
                <tr key={i}>
                  <td>{member.name}</td>
                  <td>{member.matching.score}</td>
                  <td>{member.matching.yes + member.matching.no}</td>
                  <td>{member.matching.opposite}</td>
                  <td>{member.matching.yes}</td>
                  <td>{member.matching.no}</td>
                  <td>{member.matching.novote}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  ), rootNode)
}

document.addEventListener('DOMContentLoaded', () => {
  const $app = $('#app').html('')
  const $motionCount = $('<div>載入議案資料中⋯⋯</div>').appendTo($app)
  const $motionSelect = $('<select name="select-items" multiple style="width: 100%" />')
  const $votes = $('<div />')
  const $result = $('<div />')

  $motionSelect.on('change', onSelectChange($votes.get(0), $motionSelect))
  $votes.on('change', 'input', onVoteChange($result.get(0)))

  $.getJSON('data.json', (data) => {
    // console.log(data)
    _data = data

    _.each(data.motions, (motion, motionId) => {
      motion.id = motionId
      motion.group = `${motion.meetingType} - ${motion.voteDate}`
      motion.voteDateMoment = moment(motion.voteDate, 'DD/MM/YYYY')
    })

    const groups = _.groupBy(data.motions, 'group')
    $motionSelect.appendTo($app).select2({
      data: _.map(groups, (motions, text) => {
        const children = _.map(motions, (motion) => {
          return {
            id: motion.id,
            text: motion.title,
          }
        })
        return {
          text,
          children,
        }
      }),
      theme: 'bootstrap',
    })

    const latestMotion = _.maxBy(_.values(data.motions), (motion) => motion.voteDateMoment)
    const lastUpdated = latestMotion.voteDateMoment.format('DD/MM/YYYY')
    $motionCount.text(`共 ${_.size(data.motions)} 個議案，最近更新：${lastUpdated}。`)
    $app.append($votes, $result)

    if (__DEV__) {
      $motionSelect.val($motionSelect.find('option').eq(0).attr('value')).trigger('change')
    }
  })
})
