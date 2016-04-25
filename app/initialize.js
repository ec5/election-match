import _ from 'lodash'
import $ from 'jquery'
import selectize from 'selectize'

document.addEventListener('DOMContentLoaded', () => {
  const $app = $('#app').html('')
  const $motionSelect = $('<select name="select-items" multiple />').appendTo($app).selectize()
  const motionSelectize = $motionSelect[0].selectize
  const $motionCount = $('<span>0</span>')

  $('<div />').appendTo($app)
    .append('<span>共 </span>')
    .append($motionCount)
    .append('<span> 個議案</span></div>')

  let motionCount = 0
  $.getJSON('data/votes.json', (votes) => {
    votes = _.flatten(_.map(votes, (v) => v))
    console.log(votes)

    const groups = new Set()
    _.each(votes, (meeting) => {
      const optgroup = `${meeting['@type']} - ${meeting['@start-date']}`
      motionSelectize.addOptionGroup(optgroup, {
        label: optgroup,
      })
      _.each(meeting.vote, (vote) => {
        if (!vote) {
          return
        }
        motionCount += 1
        motionSelectize.addOption({
          value: `${optgroup} - ${vote['@number']}`,
          text: `${vote['motion-ch']}`,
          optgroup,
        })
      })
    })

    motionSelectize.refreshOptions()
    $motionCount.text(motionCount)
  })
})
