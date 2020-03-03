import React, {Component} from 'react';
import _ from 'lodash';
import * as firebase from 'firebase';

firebase.initializeApp({
    apiKey: "AIzaSyAixqeLrcjKTVP85dEVG9OXncV48DrkRZ8",
    authDomain: "kadiapp-a6720.firebaseapp.com",
    databaseURL: "https://kadiapp-a6720.firebaseio.com",
    projectId: "kadiapp-a6720",
    storageBucket: "kadiapp-a6720.appspot.com",
    messagingSenderId: "609585162757",
    appId: "1:609585162757:web:788b2791b5f10adc7cca6c"
});

function Loading() {
    return <div className="lds"></div>
}

function retrieveItems() {
    let items = localStorage.getItem('items');
    if(items) items = items.split(',').map(i => ({name: i, count: 0}));
    return items || [];
}

export default class List extends Component {
    state = {
        list: retrieveItems(),
        prompt: false,
        loading: true,
    }
    msg = {}
    toggle = (cb, msg = {}) => {
        this.msg = msg;
        this.cb = cb;
        this.setState({
            prompt: !this.state.prompt,
        })
    }
    componentDidMount() {
        firebase.database().ref('weblist').on('value', s => {
            let list = s.val();
            let getCount = name => {
                return _.get(_.find(this.state.list, ['name', name]), 'count', 0);
            }
            if(list) {
                localStorage.setItem('items', list);
                list = list.map(f => ({name: f, count: getCount(f)}));
                this.setState({list, loading: false});
            }
        });
        window.onpopstate = () => this.setState({prompt: false});
    }
    componentDidUpdate(props, state) {
        if(this.state.prompt && !state.prompt) window.history.pushState({}, '', '');
    }
    render() {
        let saveList = () => {
            let list = this.state.list.map(f => f.name);
            firebase.database().ref('weblist').set(list);
            localStorage.setItem('items', list);
        }
        let reorderList = () => {
            let debounce = () => {
                this.setState({list: this.state.list.sort((a, b) => b.count - a.count)}, saveList);
                this.debounce = null;
                document.activeElement.blur();
            }
            if(!this.debounce) this.debounce = setTimeout(debounce, 2500);
        }
        let increment = (idx) => {
            return e => {
                this.setState({list: this.state.list.map((item, i) => idx === i ? Object.assign({}, item, {count: item.count + 1}) : item)});
            }
        }
        let decrement = (idx) => {
            return e => {
                if(this.state.list[idx].count > 0) {
                    this.setState({list: this.state.list.map((item, i) => idx === i ? Object.assign({}, item, {count: item.count - 1}) : item)});
                }
            }
        }
        let reset = () => {
            this.cb = () => {
                this.state.list.forEach(f => f.count = 0);
                this.setState({list: this.state.list, prompt: false});
            }
            this.msg = {title: 'Are you sure you want to reset?', yes: 'Reset', no: 'Don\'t reset'};
            this.setState({prompt: true});
        }
        let reorder = () => {
            this.setState({list: this.state.list.sort((a, b) => b.count - a.count)}, saveList);
        }
        let add = () => {
            let name = this.refs.input.value;
            if(!name) return;
            let idx = _.findIndex(this.state.list, f => f.name === name);
            let exists = idx > -1;
            if(exists) document.querySelectorAll('.list-i')[idx].scrollIntoView();
            else this.setState({
                list: this.state.list.concat({name, count: 0})
            }, () => {
                this.refs.input.value = '';
                saveList();
            });
        }
        let removeItem = (idx) => {
            this.setState({
                list: this.state.list.slice(0, idx).concat(this.state.list.slice(idx + 1)),
                prompt: false,
            }, saveList);
        }
        let itemClick = (idx) => {
            let cb = () => removeItem(idx);
            let msg = {title: 'Are you sure you want to remove?', yes: 'Remove', no: 'Don\'t remove'};
            this.toggle(cb, msg);
            // window.navigator.vibrate(100);
        }
        let setVal = (idx) => {
            return e => {
                this.setState({list: this.state.list.map((f, i) => {
                    let n = {};
                    if(i === idx) n.count = parseInt(e.target.value, 10);
                    return Object.keys(n).length ? Object.assign({}, f, n) : f;
                })});
            }
        }
        let onKeyDown = e => {
            if(e.keyCode === 13) add();
        }
        let onMouseDown = i => {
            this.press = setTimeout(() => {
                itemClick(i);
            }, 500);
        }
        let toggleReset = show => {
            document.querySelector('.list-gs').style.display = show ? 'block' : 'none';
        }
        let busy = this.state.loading && this.state.list.length === 0;
        return (
            this.state.prompt ? <div className="prompt">
                <div className="p-c">
                    <div className="prompt-t">{this.msg.title}</div>
                    <div className="prompt-c">
                        <div className="prompt-n"><button onClick={() => this.toggle()}>{this.msg.no}</button></div>
                        <div className="prompt-y"><button className="danger" onClick={this.cb}>{this.msg.yes}</button></div>
                    </div>
                </div>
            </div> : <div className={'list' + (busy ? ' busy' : '')}>
                {busy && <Loading />}
                {!busy && <div className="list-g">
                    <div className="list-gi">
                        <input ref="input" type="text" onKeyDown={onKeyDown} onFocus={() => toggleReset(false)} onBlur={() => toggleReset(true)} />
                    </div>
                </div>}
                {!busy && <div className="list-c">
                    {this.state.list.map((f, i) => {
                        return <div className="list-i" key={i} onMouseDown={() => onMouseDown(i)} onMouseUp={() => clearTimeout(this.press)} onTouchStart={() => onMouseDown(i)} onTouchMove={() => clearTimeout(this.press)} onTouchEnd={() => clearTimeout(this.press)}>
                            <div className="lbl">{f.name}</div>
                            <div className="list-ir" onTouchStart={e => e.stopPropagation()}>
                                <div className="btnc">
                                    <button className="less" onClick={decrement(i)}>
                                        <img src={require('../minus.png')} alt="less" />
                                    </button>
                                </div>
                                <div className="inp"><input value={f.count} onChange={setVal(i)} type="number" /></div>
                                <div className="btnc">
                                    <button className="more" onClick={increment(i)}>
                                        <img src={require('../plus.png')} alt="more" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    })}
                    {this.state.list.length === 0 && <div className="list-i empty">No items</div>}
                </div>}
                {this.state.list.length > 0 && <div className="list-gs"><button onClick={reorder} className="danger">Reorder</button></div>}
            </div>
        )
    }
}