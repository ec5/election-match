import React from 'react'

import Clearfix from 'react-bootstrap/lib/Clearfix'
import CloseButton from './CloseButton'
import VoteDateDropdown from './VoteDateDropdown'


const renderMotionVote = ({ motions, voted, onVoteYes, onVoteNo, onRemoveMotion }) => (i) => {
  const motion = motions[i]
  return (
    <div key={i} className="form-group list-group-item lead">
      <h4 className="list-group-item-heading">
        <Clearfix style={{margin: '0.5rem 0 1.5rem'}}>
          {_.has(voted, motion.id) && <CloseButton onClick={() => onRemoveMotion(motion.id)} />}
          <VoteDateDropdown motion={motion} />
        </Clearfix>
        {motion.title}
      </h4>
      <label className="radio-inline">
        <input
          type="radio"
          name={motion.id}
          value="yes"
          onChange={() => onVoteYes(motion)}
          checked={_.get(voted, motion.id) === 'yes'}
        /> 贊成
      </label>
      <label className="radio-inline">
        <input
          type="radio"
          name={motion.id}
          value="no"
          onChange={() => onVoteNo(motion)}
          checked={_.get(voted, motion.id) === 'no'}
        /> 反對
      </label>
    </div>
  )
}

export default renderMotionVote
