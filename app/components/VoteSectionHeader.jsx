import React from 'react'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'
import Badge from 'react-bootstrap/lib/Badge'

const VoteSectionHeader = ({ activeTab, onSelectTab, votedCount, isAllVoted, canShare }) => {
  const showResult = votedCount > 0 && isAllVoted
  return (
    <header>
      <h3>議案投票</h3>
      <p className="lead">假如你是立法會議員，你會如何投票？</p>
      <Nav bsStyle="tabs" activeKey={activeTab} onSelect={onSelectTab} justified={true}>
        <NavItem eventKey={1}>選取議案</NavItem>
        <NavItem eventKey={2} disabled={votedCount === 0}>
          你的投票{' '}
          <Badge className={showResult ? 'alert-success' : ''}>{votedCount}</Badge>
        </NavItem>
        <NavItem eventKey={3} disabled={!showResult}>配對結果</NavItem>
        <NavItem eventKey={4} disabled={!canShare}>分享</NavItem>
      </Nav>
    </header>
  )
}

export default VoteSectionHeader
