import _ from 'lodash'
import React from 'react'
import DropdownButton from 'react-bootstrap/lib/DropdownButton'
import MenuItem from 'react-bootstrap/lib/MenuItem'

import { getUrls } from '../motion'

const VoteDateDropdown = ({ motion }) => {
  const urls = getUrls(motion)
  return (
    <DropdownButton
      bsStyle="link"
      title={motion.voteDate}
      id={`vote-date-dropdown-${motion.id}`}
      style={{paddingLeft: 0, paddingRight: 0}}
    >
      {_.reduce([
        ['agenda', '會議議程'],
        ['rundown', '會議過程正式紀錄'],
        ['minutesPdf', '會議紀要 PDF'],
        ['results', '決定的紀錄'],
        ['votingPdf', '投票結果 PDF'],
        ['votingResults', '投票結果'],
      ], (r, [k, title], i) => {
        const url = urls[k]
        if (url) {
          r.push(<MenuItem key={i} href={url} rel="nofollow" target="_blank">{title}</MenuItem>)
        }
        return r
      }, [])}
      <MenuItem divider />
      <MenuItem href={urls.index} rel="nofollow" target="_blank">會議</MenuItem>
    </DropdownButton>
  )
}

export default VoteDateDropdown
