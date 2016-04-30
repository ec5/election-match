import _ from 'lodash'
import React from 'react'
import {render} from 'react-dom'

import $ from 'jquery'
import 'select2'

let _data = {}
const motions = {}
const memberVotes = {}

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
          <div key={i} className="form-group list-group-item">
            <h4 className="list-group-item-heading">{motion.title}</h4>
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
    <div>
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

  $.getJSON('data.json', (data) => {
    // console.log(data)
    _data = data

    _.each(data.motions, (motion, motionId) => {
      motion.id = motionId
      motion.group = `${motion.meetingType}_${motion.voteDate}`
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

    $motionCount.text(`共 ${_.size(data.motions)} 個議案`)
    $votes.appendTo($app)
    $result.appendTo($app)

    if (__DEV__) {
      $motionSelect.val('Council Meeting_17/10/2012_0_1_17/10/2012_19:37:53').trigger('change')
    }
  })
})
