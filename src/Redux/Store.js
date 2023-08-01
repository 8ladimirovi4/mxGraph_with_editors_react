
import { composeWithDevTools } from '@redux-devtools/extension';
import { createStore, combineReducers } from 'redux'
import linksReducer from './Reducers/linksReducer';


const rootReducer = combineReducers({
 links: linksReducer,
 destroy: linksReducer
})

const store = createStore(rootReducer, composeWithDevTools());

export default store
