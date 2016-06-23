import React from 'react'

const CloseButton = ({ onClick }) => {
  return (
    <button
      type="button"
      className="close pull-right"
      ariaLabel="Close"
      onClick={onClick}
    >
      <span ariaHidden="true">&times;</span>
    </button>
  )
}

export default CloseButton
