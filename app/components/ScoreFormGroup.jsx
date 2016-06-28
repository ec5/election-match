import React from 'react'
import InputGroup from 'react-bootstrap/lib/InputGroup'
import FormControl from 'react-bootstrap/lib/FormControl'

const ScoreFormGroup = ({ title, ...props }) => {
  return (
    <InputGroup style={{marginBottom: 10}}>
      <InputGroup.Addon>{title}</InputGroup.Addon>
      <FormControl type="number" {...props} />
    </InputGroup>
  )
}

export default ScoreFormGroup
