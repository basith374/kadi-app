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

export default class List extends Component {
    state = {
        list: [],
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
        firebase.database().ref('weblist').once('value').then(s => {
            let list = s.val();
            if(list) {
                list = list.map(f => ({name: f, count: 0}));
                this.setState({list, loading: false});
            }
        });
    }
    render() {
        let saveList = () => firebase.database().ref('weblist').set(this.state.list.map(f => f.name))
        let increment = (idx) => {
            return e => {
                e.stopPropagation();
                this.state.list[idx].count++;
                this.setState({list: this.state.list}, saveList);
            }
        }
        let decrement = (idx) => {
            return e => {
                e.stopPropagation();
                this.state.list[idx].count--;
                this.setState({list: this.state.list}, saveList);
            }
        }
        let reset = () => {
            this.cb = () => {
                this.state.list.forEach(f => f.count = 0);
                this.setState({list: this.state.list, prompt: false}, saveList);
            }
            this.msg = {title: 'Are you sure you want to reset?', yes: 'Reset', no: 'Don\'t reset'};
            this.setState({prompt: true});
        }
        let add = () => {
            let name = this.refs.input.value;
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
        }
        let setVal = (idx) => {
            return e => {
                this.state.list.map((f, i) => {
                    if(i === idx) f.count = e.target.value;
                });
                this.setState({list: this.state.list});
            }
        }
        return (
            this.state.prompt ? <div className="prompt">
                <div className="p-c">
                    <div className="prompt-t">{this.msg.title}</div>
                    <div className="prompt-c">
                        <div className="prompt-n"><button className="green" onClick={() => this.toggle()}>{this.msg.no}</button></div>
                        <div className="prompt-y"><button className="danger" onClick={this.cb}>{this.msg.yes}</button></div>
                    </div>
                </div>
            </div> : <div className={'list' + (this.state.loading ? ' busy' : '')}>
                {this.state.loading && <Loading />}
                {!this.state.loading && <div className="list-g">
                    <div className="list-gi">
                        <input ref="input" type="text" />
                    </div>
                    <div className="list-gb">
                        <button onClick={add} className="green"><img src={require('../plus.png')} /></button>
                    </div>
                </div>}
                {!this.state.loading && <div className="list-c">
                    {this.state.list.map((f, i) => {
                        return <div className="list-i" key={i} onClick={() => itemClick(i)}>
                            <div className="lbl">{f.name}</div>
                            <div className="btnc">
                                <button className="less" onClick={decrement(i)}>
                                    <img src={require('../minus.png')} />
                                </button>
                            </div>
                            <div className="inp"><input onClick={e => e.stopPropagation()} value={f.count} onChange={setVal(i)} type="number" /></div>
                            <div className="btnc">
                                <button className="more" onClick={increment(i)}>
                                    <img src={require('../plus.png')} />
                                </button>
                            </div>
                        </div>
                    })}
                    {this.state.list.length === 0 && <div className="list-i empty">No items</div>}
                </div>}
                {this.state.list.length > 0 && <div className="list-gs"><button onClick={reset} className="danger">Reset</button></div>}
            </div>
        )
    }
}