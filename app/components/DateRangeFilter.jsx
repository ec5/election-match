/* globals $ */
import _ from 'lodash'
import React from 'react'
import { DATE_FORMAT } from '../motion'

class DateRangeFilter extends React.Component {
  componentDidMount() {
    $(this._input).daterangepicker({
      autoApply: true,
      locale: {
        format: DATE_FORMAT,
      },
      showDropdowns: true,
      ..._.pick(this.props, [
        'startDate', 'endDate',
        'minDate', 'maxDate',
      ]),
    })
    .on('change', this.props.onChange)
  }

  render() {
    return (
      <input
        ref={(c) => { this._input = c }}
        type="text"
        name="datefilter"
        className="form-control"
      />
    )
  }
}

export default DateRangeFilter
