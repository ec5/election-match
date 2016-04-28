import _ from 'lodash'
import React from 'react'
import {render} from 'react-dom'

import $ from 'jquery'
import 'select2'

const motions = {}
const memberVotes = {}

const onSelectChange = (rootNode, $motionSelect) => (event) => {
  const selectedMotions = _.map($motionSelect.val(), (motionId) => {
    return [motionId, motions[motionId]]
  })
  // console.log(selectedMotions)
  render((
    <form className="container">
      <h3>議案投票</h3>
      <div className="list-group">
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
      </div>
    </form>
  ), rootNode)
}

const onVoteChange = (rootNode) => (event) => {
  const $form = $(event.target).closest('form')
  const voted = $form.serializeArray()
  // console.log(voted)

  render((
    <div className="container">
      <h3>結果</h3>
      <div className="list-group">

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

  let motionCount = 0
  $.getJSON('data/votes.json', (votes) => {
    // TODO generate data as simple array
    votes = _.flatten(_.map(votes, (v) => v))
    // console.log(votes)

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
    $result.appendTo($app)

    if (__DEV__) {
      $motionSelect.val('Council Meeting_17/10/2012_1').trigger('change')
    }
  })
})
