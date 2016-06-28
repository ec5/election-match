import _ from 'lodash'
import React from 'react'

import Clearfix from 'react-bootstrap/lib/Clearfix'
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem'
import CloseButton from './CloseButton'
import VoteDateDropdown from './VoteDateDropdown'


const renderMotionVote = ({ motions, voted, onAddMotion, onRemoveMotion }) => (i) => {
  const motion = motions[i]
  const selected = _.has(voted, motion.id)
  return (
    <ListGroupItem
      key={i}
      header={motion.title}
      bsStyle={selected ? 'success' : ''}
      onClick={() => {
        if (selected) onRemoveMotion(motion.id)
        else onAddMotion(motion)
      }}
      >
      {motion.meetingType}
      {' '}
      <VoteDateDropdown motion={motion} />
    </ListGroupItem>
  )
}

export default renderMotionVote
