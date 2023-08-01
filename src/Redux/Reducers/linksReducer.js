const initialState = {
    link: null,
}

const types = {
    SET_LINK: 'SET_LINK',
    CHANGE_STATE: 'CHANGE_STATE'
}

const actions = {
    setLink: (link) => ({
        type: types.SET_LINK,
        payload: link
    }),
}

const linksReducer = (state = initialState, action) => {
    switch (action.type) {
        case types.SET_LINK: {
           return {...state, link: action.payload}
        }
        default:
            return state;
    }
}

export default linksReducer
export { initialState }
export const {
    setLink,
} = actions