// eslint-disable-next-line complexity
export function parse(codeStr: string, strIndex = 0, options?: { limit?: number }) {
    let expression: {
        type: string;
        start: number;
        end: number;
        value: string | number;
        operator?: string;
        left?: any;
        right?: any;
        extra: {
            parenthesized?: boolean;
        }
    } = {
        type: '',
        start: strIndex,
        end: strIndex,
        value: '',
        extra: {},
    };
    let hitCount = 0;
    while (strIndex < codeStr.length && (options?.limit ? hitCount < options?.limit : true)) {
        const char = codeStr[strIndex];
        switch (char) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '0': {
                expression = parseNumber(codeStr, strIndex);
                strIndex = expression.end + 1;
                hitCount++;
                break;
            }
            case '&':
            case '|': {
                const logicType = char === '&' ? 'and' : 'or';
                const leftNode = expression.operator === '||' && logicType === 'and' ? expression.right : expression;
                if (!leftNode) {
                    throw Error('need left expression');
                }
                const nextExpression = parseLogicalExpression(codeStr, strIndex, logicType, leftNode);
                if (leftNode === expression) {
                    expression = nextExpression;
                    strIndex = expression.end + 1;
                } else {
                    expression.right = nextExpression;
                    strIndex = expression.right.end + 1;
                }
                hitCount++;
                break;
            }
            // case '!'
            case '(': {
                console.log('start (', expression);
                strIndex++;
                expression.extra.parenthesized = true;
                expression = parse(codeStr, strIndex)!;
                strIndex = expression.end + 1;
                break;
            }
            // eslint-disable-next-line no-fallthrough
            case ')': {
                if (strIndex === 0) {
                    throw Error('缺少左括号');
                }
                hitCount++;
                strIndex++;
                break;
            }
            default: throw Error('不支持的字符：' + codeStr[strIndex]);
        }
        console.log(strIndex, 'expression', JSON.stringify(expression));
    }
    expression.value = codeStr.substring(expression.start, expression.end);
    return expression;
}

function parseNumber(codeStr: string, strIndex: number) {
    const startIndex = strIndex;
    let endIndex = startIndex;
    let strValue = '';

    while (endIndex < codeStr.length) {
        const char = codeStr[endIndex];
        if (/\d/.test(char)) {
            strValue += char;
            if (!isFinite(Number(strValue))) {
                throw Error('超出number有效范围');
            } else {
                endIndex++;
            }
        } else {
            break;
        }
    }
    console.log('strValue', strValue);

    return {
        type: 'NumericLiteral',
        start: startIndex,
        end: endIndex - 1,
        value: Number(strValue),
        extra: {},
    };
}

function parseLogicalExpression(
    codeStr: string, strIndex: number,
    type: 'and' | 'or', leftNode: any,
) {
    console.log('leftNode', leftNode);
    let rightNode;
    const startIndex = strIndex;
    let endIndex = startIndex;
    let strValue = codeStr[strIndex];
    if (codeStr[startIndex + 1] !== strValue) {
        throw Error('非法逻辑表达式');
    }
    strValue += codeStr[startIndex + 1];
    endIndex += 2;

    rightNode = parse(codeStr, endIndex, { limit: 1 })!;

    strValue += rightNode.value;

    return {
        type: 'LogicalExpression',
        left: leftNode,
        right: rightNode,
        start: startIndex,
        end: endIndex,
        value: strValue,
        operator: strValue.slice(0, 2),
        extra: {},
    };
}