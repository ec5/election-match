import React from 'react'
import FormGroup from 'react-bootstrap/lib/DropdownButton'
import ControlLabel from 'react-bootstrap/lib/ControlLabel'
import FormControl from 'react-bootstrap/lib/FormControl'

const ScoreFormGroup = ({ title, ...props }) => {
  return (
    <FormGroup>
      <ControlLabel className="col-sm-2">{title}</ControlLabel>
      <div className="col-sm-10">
        <FormControl type="number" {...props} />
      </div>
    </FormGroup>
  )
}

export default ScoreFormGroup
