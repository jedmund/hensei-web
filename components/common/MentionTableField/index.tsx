import TableField from '~components/common/TableField'
import MentionTypeahead from '../MentionTypeahead'
import Typeahead from 'react-bootstrap-typeahead/types/core/Typeahead'

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
  typeaheadRef: React.Ref<Typeahead>
  onUpdate: (content: MentionItem[]) => void
}

const MentionTableField = ({
  label,
  description,
  placeholder,
  inclusions,
  exclusions,
  typeaheadRef,
  ...props
}: Props) => {
  return (
    <TableField
      {...props}
      name={props.name || ''}
      description={description}
      className="mention"
      label={label}
    >
      <MentionTypeahead
        ref={typeaheadRef}
        label={label}
        description={description}
        placeholder={placeholder}
        inclusions={inclusions}
        exclusions={exclusions}
        onUpdate={props.onUpdate}
      />
    </TableField>
  )
}

export default MentionTableField
