import { Context, Session, h, z } from 'koishi'

export const name = 'w-as-forward'

export interface Config {
    minLength: number
}

export const Config: z<Config> = z.object({
    minLength: z.natural().default(100).description('转为合并转发发送的最小消息长度')
})

interface AsForwardElement extends h {
    type: 'as-forward'
    attrs: AsForwardAttr
}

interface AsForwardAttr {
    level?: 'always' | 'never' | 'auto'
    children?: any[]
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'as-forward': AsForwardAttr
        }
    }
}

export function apply(ctx: Context, config: Config) {
    const sum = (xs: number[]) => xs.reduce((a, c) => a + c, 0)

    const getElementLength = (element: h) => element.type === 'text' ? element.toString().length : 1

    const isAsForwardElement = (element: h): element is AsForwardElement => element.type === 'as-forward'

    const renderAsForward = ({ level }: AsForwardAttr, children: h[], _session: Session): h => {
        if (level === 'always' ||
            level === 'auto' && sum(children.map(getElementLength)) > config.minLength
        ) return <message forward>
            { children }
        </message>
        return <>{ children }</>
    }

    ctx.before('send', (session) => {
        let elements = h.parse(session.content)
        if (elements.length === 1) {
            const [ element ] = elements
            if (! isAsForwardElement(element))
                session.elements = [ renderAsForward({ level: 'auto' }, [ element ], session) ]
        }
    }, true)

    ctx.component('as-forward', renderAsForward)
}
