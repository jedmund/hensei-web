import TableField from '~components/common/TableField'
import MentionTypeahead from '../MentionTypeahead'

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

const MentionTableField = ({
  label,
  description,
  placeholder,
  inclusions,
  exclusions,
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
