interface User {
    id: string
    username: string
    granblueId: number
    picture: {
        picture: string
        element: string
    }
    private: boolean
}