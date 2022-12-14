import React, { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import Console, { ConsoleHandle, LogItem } from './console'
import { postCode } from 'services/fetchCompiler'
import style from './ide.module.scss'
import { Button } from 'react-bootstrap';
import LOG_COLORS from './logcolors.json'
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Props = {
    /**
     * @param {string} - A string specifying the programming language that is going to be compiled
     */
    language: string
    /**
     * @param {string} - The code written by the user
     */
    value: string
    /**
     * @param {React.ReactElement<typeof Button>} - An ReactElement representing the save button (optional).
     */
    onSave: () => void

    disableSaveBtn: boolean

    onChange?: (data: string) => void;
}

/**
 * This component uses Monaco Editor to allow the users to write code and executed it. It includes a console to display outputs and allows inputs
 */
export default function Ide(props: Props) {
    //States
    const [code, setCode] = useState(props.value)
    const [consoleInput, setConsoleInput] = useState<string[]>([])
    const [disableRunBtn, setDisableRunBtn] = useState<boolean>(false)

    useEffect(() => {
        if (props.onChange)
            props.onChange(code)
    }, [code]);

    //References
    const consoleRef = useRef<ConsoleHandle>(null)

    const run = () => {
        setDisableRunBtn(true)
        const input = consoleInput.join('\n')
        const promise = new Promise((resolve, reject) => postCode({ language: props.language, code, input })
            .then(({ data, status }) => {
                const { code, msg } = data

                let color = LOG_COLORS.timeout
                switch (code) {
                    case 21:
                        color = LOG_COLORS.error
                        break
                    case 10:
                        color = LOG_COLORS.success
                        break
                }

                const logOutput: LogItem = { type: 'output', color, content: msg }
                consoleRef.current?.addCodeOutput(logOutput)
                setDisableRunBtn(false)
                resolve('Successfull')
            })
            .catch((e) => {
                console.log(e)
                setDisableRunBtn(false)
                reject('Failed')
            }));
        toast.promise(
            promise,
            {
                pending: 'Running',
                error: 'Execution error, please try again!'
            }, { position: toast.POSITION.BOTTOM_RIGHT, autoClose: 1500 }
        )
    }

    return (
        <>
            <Row className='align-items-center'>
                <Col xs='auto'>
                    <button className={style.customButton + ' ' + style.saveBtn}
                        onClick={() => props.onSave()}
                        disabled={props.disableSaveBtn}>
                        <i className={style.icon + ' bi bi-file-earmark-code-fill'}></i>
                        Save
                    </button>
                </Col>
                <Col xs='auto'>
                    <button className={style.customButton}
                        data-cy='runBtn'
                        onClick={(e) => run()}
                        disabled={disableRunBtn}>
                        <i className={style.icon + ' bi bi-caret-right-fill'}></i>
                        Run
                    </button>
                </Col>
            </Row>
            <div className={style.container}>
                <Allotment vertical>
                    <div className={style.ide}>
                        <div data-cy='editor' className={style.editor}>
                            <Editor
                                defaultValue=""
                                language={props.language}
                                theme="vs-dark"
                                value={code}
                                onChange={(v, e) => {
                                    setCode(v as string)
                                }}
                            />
                        </div>
                    </div>
                    <div className={style.ide}>
                        <Console
                            onSubmitInput={setConsoleInput}
                            ref={consoleRef} />
                    </div>
                </Allotment>
            </div>
        </>
    )
}