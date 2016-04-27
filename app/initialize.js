import _ from 'lodash'
import React from 'react'
import {render} from 'react-dom'

import $ from 'jquery'
import 'select2'

const votes = {}

const updateSelect = (rootNode, $motionSelect) => (event) => {
  render((
    <div>Votes</div>
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
        votes[id] = {
          ...vote,
          ...group,
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
