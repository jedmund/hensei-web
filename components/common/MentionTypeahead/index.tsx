import { useState } from 'react'
import { getCookie } from 'cookies-next'
import type {
  Option,
  RenderTokenProps,
} from 'react-bootstrap-typeahead/types/types'

import {
  AsyncTypeahead,
  Menu,
  MenuItem,
  RenderMenuProps,
  Token,
} from 'react-bootstrap-typeahead'

import api from '~utils/api'
import { numberToElement } from '~utils/elements'

import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label: string
  description?: string
  placeholder?: string
  inclusions: MentionItem[]
  exclusions: MentionItem[]
  onUpdate: (content: MentionItem[]) => void
}

interface RawSearchResponse {
  searchable_type: string
  granblue_id: string
  name_en: string
  name_jp: string
  element: number
}

const MentionTypeahead = ({
  label,
  description,
  placeholder,
  inclusions,
  exclusions,
  ...props
}: Props) => {
  const locale = getCookie('NEXT_LOCALE')
    ? (getCookie('NEXT_LOCALE') as string)
    : 'en'

  console.log(inclusions)

  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<Option[]>([])

  async function handleSearch(query: string) {
    setIsLoading(true)

    const exclude = [...inclusions, ...exclusions]

    const response = await api.searchAll(query, exclude, locale)
    const results = response.data.results

    setIsLoading(false)
    setOptions(mapResults(results))
  }

  function transform(object: RawSearchResponse) {
    const result: MentionItem = {
      name: {
        en: object.name_en,
        ja: object.name_jp,
      },
      type: object.searchable_type.toLowerCase(),
      granblue_id: object.granblue_id,
      element: numberToElement(object.element),
    }
    return result
  }

  function mapResults(results: RawSearchResponse[]) {
    return results
      .map((rawObject: RawSearchResponse) => {
        const object = transform(rawObject)
        return {
          granblue_id: object.granblue_id,
          element: object.element,
          type: object.type,
          name: {
            en: object.name.en,
            ja: object.name.ja,
          },
        }
      })
      .slice(0, 5)
  }

  function renderMenu(results: Option[], menuProps: RenderMenuProps) {
    return (
      <Menu {...menuProps} className={styles.menu} emptyLabel="No items found">
        {results.map((option, index) => (
          <MenuItem key={index} option={option} position={index}>
            {renderMenuItemChild(option)}
          </MenuItem>
        ))}
      </Menu>
    )
  }

  function renderMenuItemChild(option: Option) {
    const item = option as MentionItem
    return (
      <div className={styles.item}>
        <div className={styles[item.type]}>
          <img
            alt={item.name[locale]}
            src={
              item.type === 'character'
                ? `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/${item.type}-square/${item.granblue_id}_01.jpg`
                : item.type === 'job'
                ? `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-icons/${item.granblue_id}.png`
                : `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/${item.type}-square/${item.granblue_id}.jpg`
            }
          />
        </div>
        <span>{item.name[locale]}</span>
      </div>
    )
  }

  function renderToken(option: Option, props: RenderTokenProps) {
    const item = option as MentionItem
    const { labelKey, ...tokenProps } = props
    return (
      <Token
        {...tokenProps}
        className={styles.token}
        data-element={item.element.slug}
        data-type={item.type}
        option={option}
      >
        {item.name[locale]}
      </Token>
    )
  }

  return (
    <AsyncTypeahead
      multiple
      className={styles.typeahead}
      id={label}
      align="left"
      isLoading={isLoading}
      labelKey={(option) => (option as MentionItem).name[locale]}
      defaultSelected={inclusions}
      filterBy={() => true}
      minLength={3}
      onSearch={handleSearch}
      options={options}
      useCache={false}
      placeholder={placeholder}
      positionFixed={true}
      promptText={'Start typing...'}
      searchText={'Searching...'}
      renderMenu={renderMenu}
      renderMenuItemChildren={renderMenuItemChild}
      renderToken={renderToken}
      highlightOnlyResult={false}
      onChange={(selected) => props.onUpdate(selected as MentionItem[])}
    />
  )
}

export default MentionTypeahead
