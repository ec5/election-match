import React from 'react'
import copyToClipboard from 'copy-to-clipboard'

import Button from 'react-bootstrap/lib/Button'
import FormGroup from 'react-bootstrap/lib/FormGroup'
import InputGroup from 'react-bootstrap/lib/InputGroup'
import FormControl from 'react-bootstrap/lib/FormControl'

const copyToClipboardSafely = (shortUrl) => {
  try {
    copyToClipboard(shortUrl)
  } catch (ex) {
    // error
  }
}

const GenerateShareUrl = ({ url, shortUrl, onGenerateShortUrl }) => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (shortUrl) {
          copyToClipboardSafely(shortUrl)
        } else {
          onGenerateShortUrl(url, (res) => {
            copyToClipboardSafely(res.shortUrl)
          })
        }
      }}>
      <FormGroup>
        <InputGroup>
          <FormControl
            type="text"
            value={shortUrl || url}
            readOnly={true}
            style={{textOverflow: 'ellipsis'}}
          />
          <InputGroup.Button>
            <Button type="submit" bsStyle="primary">複製短網址</Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    </form>
  )
}

export default GenerateShareUrl
