import React from 'react'
import Navbar from 'react-bootstrap/lib/Navbar'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'
import Badge from 'react-bootstrap/lib/Badge'

const PageNavbar = ({ activeTab, onSelectTab, votedCount, showResult, canShare }) => {
  return (
    <div style={{height: 60}}>
      <Navbar fixedTop>
        <Nav
          bsStyle="pills"
          activeKey={1}
          activeKey={activeTab}
          onSelect={onSelectTab}
          style={{marginLeft: 0}}
          >
          <NavItem eventKey={1}>選議案</NavItem>
          <NavItem eventKey={2} disabled={votedCount === 0}>
            投票
            <Badge className={showResult ? 'alert-success' : ''}>{votedCount}</Badge>
          </NavItem>
          <NavItem eventKey={3} disabled={!showResult}>結果</NavItem>
          <NavItem eventKey={4} disabled={!canShare}>分享</NavItem>
          <NavItem eventKey={5}>
            注意
            <Badge className="alert-danger">!</Badge>
          </NavItem>
        </Nav>
      </Navbar>
    </div>
  )
}

export default PageNavbar
