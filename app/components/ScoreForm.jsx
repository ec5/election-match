import React from 'react'

import Panel from 'react-bootstrap/lib/Panel'

const ScoreForm = ({ defaultExpanded, title, children }) => {
  return (
    <Panel header={title} collapsible defaultExpanded={defaultExpanded} bsStyle="info">
      <form className="form-horizontal">
        {children}
      </form>
    </Panel>
  )
}

export default ScoreForm
