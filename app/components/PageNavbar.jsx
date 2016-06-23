import _ from 'lodash'
import React from 'react'

import Navbar from 'react-bootstrap/lib/Navbar'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'

const PageNavbar = ({ currentNav }) => {
  return (
    <Navbar staticTop>
      <Navbar.Header>
        <Navbar.Brand active>
          <a href="#">立法會投票傾向配對</a>
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
      <Navbar.Collapse>
        <Nav>
          {_.map([
            ['vote', '議案投票'],
            // ['stats', '數據統計'],
            ['limitation', '注意事項'],
            ['about', '關於本網'],
          ], ([hash, title], i) => {
            return (
              <NavItem
                key={i}
                eventKey={hash}
                href={`#${hash}`}
                active={currentNav === hash}
              >{title}</NavItem>
            )
          })}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export default PageNavbar
