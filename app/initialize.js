import _ from 'lodash'
import $ from 'jquery'
import selectize from 'selectize'

document.addEventListener('DOMContentLoaded', () => {
  const $app = $('#app').html('')
  const $selectVoteItem = $('<select name="select-items" multiple />').appendTo($app).selectize()
  const selectizeVoteItem = $selectVoteItem[0].selectize

  $.getJSON('/data/votes.json', (votes) => {
    votes = _.flatten(_.map(votes, (v) => v))
    console.log(votes)

    const groups = new Set()
    _.each(votes, (meeting) => {
      const optgroup = `${meeting['@type']} - ${meeting['@start-date']}`
      selectizeVoteItem.addOptionGroup(optgroup, {
        label: optgroup,
      })
      _.each(meeting.vote, (vote) => {
        if (!vote) {
          return
        }
        selectizeVoteItem.addOption({
          value: `${optgroup} - ${vote['@number']}`,
          text: `${vote['motion-ch']}`,
          optgroup,
        })
      })
    })
    selectizeVoteItem.refreshOptions()
  })
})
