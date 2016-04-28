import _ from 'lodash'
import React from 'react'
import {render} from 'react-dom'

import $ from 'jquery'
import 'select2'

const motions = {}

const updateSelect = (rootNode, $motionSelect) => (event) => {
  const selectedMotions = _.map($motionSelect.val(), (motionId) => {
    return [motionId, motions[motionId]]
  })
  console.log(selectedMotions)
  render((
    <form className="container list-group">
      <h3>議案投票</h3>
      {_.map(selectedMotions, ([motionId, motion], i) => {
        return (
          <div key={i} className="form-group list-group-item">
            <h4 className="list-group-item-heading">{motion['motion-ch']}</h4>
            <label className="radio-inline">
              <input type="radio" name={motionId} value="yes" /> 贊成
            </label>
            <label className="radio-inline">
              <input type="radio" name={motionId} value="no" /> 反對
            </label>
            <label className="radio-inline">
              <input type="radio" name={motionId} value="abs" /> 棄權
            </label>
          </div>
        )
      })}
    </form>
  ), rootNode)
}

document.addEventListener('DOMContentLoaded', () => {
  const $app = $('#app').html('')
  const $motionCount = $('<div>載入議案資料中⋯⋯</div>').appendTo($app)
  const $motionSelect = $('<select name="select-items" multiple style="width: 100%" />')
  const $votes = $('<div />')

  $motionSelect.on('change', updateSelect($votes.get(0), $motionSelect))

  let motionCount = 0
  $.getJSON('data/votes.json', (votes) => {
    // TODO generate data as simple array
    votes = _.flatten(_.map(votes, (v) => v))
    console.log(votes)

    const groups = {}
    _.each(votes, (meeting) => {
      const group = `${meeting['@type']}_${meeting['@start-date']}`
      groups[group] = _.compact(_.map(meeting.vote, (vote) => {
        if (!vote) {
          return
        }
        motionCount += 1
        const id = `${group}_${vote['@number']}`
        motions[id] = {
          ...vote,
          group,
        }
        return {
          id,
          text: `${vote['motion-ch']}`,
        }
      }))
    })

    $motionSelect.appendTo($app).select2({
      data: _.map(groups, (children, text) => {
        return {
          children, text,
        }
      }),
      theme: 'bootstrap',
    })

    $motionCount.text(`共 ${motionCount} 個議案`)
    $votes.appendTo($app)
  })
})
