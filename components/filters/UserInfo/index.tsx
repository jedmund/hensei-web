import styles from './index.module.scss'

interface Props {
  user: User
}

const UserInfo = ({ user }: Props) => {
  return (
    <div className={styles.root}>
      <img
        alt={user.avatar.picture}
        className={styles[user.avatar.element]}
        srcSet={`/profile/${user.avatar.picture}.png,
                                    /profile/${user.avatar.picture}@2x.png 2x`}
        src={`/profile/${user.avatar.picture}.png`}
      />
      <h1>{user.username}</h1>
    </div>
  )
}

export default UserInfo
