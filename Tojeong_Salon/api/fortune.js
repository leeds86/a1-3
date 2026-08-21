export default async function handler(req, res) {

    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, targetYear,birthdate, calendarType, gender, birthHour } = req.body;

    // 입력값 검증
    if (!name || !birthdate || !gender) {
        return res.status(400).json({ error: '필수 입력값이 없습니다.' });
    }

    // 프롬프트 만들기
    const hourText = birthHour ? `태어난 시: ${birthHour}시` : '태어난 시: 미상';
    const calendarText = calendarType === 'lunar' ? '음력' : '양력';

    const prompt = `
당신은 조선시대 토정 이지함의 지혜를 현대적으로 해석하는 운세 전문가입니다.
이지함 선생의 마음처럼 따뜻하고 인문학적인 말투로, 아래 정보를 바탕으로 토정비결식 운세를 풀어주세요.

[의뢰인 정보]
- 이름: ${name}
- 궁금한 시기: ${targetYear}
- 생년월일: ${birthdate} (${calendarText})
- 성별: ${gender}
- ${hourText}

아래 3가지로 나눠서 따뜻하게 풀이해주세요:
1. 사주로 본 타고난 성향
2. 토정비결로 본 ${targetYear}의 운세
3. 두 관점을 종합한 조언

[해석 원칙]
- 위에 제공된 사주 계산 결과를 기준으로 해석하세요.
- 제공되지 않은 사주 정보를 임의로 계산하거나 만들어내지 마세요.
- ${targetYear}의 흐름과 타고난 성향을 연결해서 해석하세요.
- 어려운 명리학 용어는 가능한 한 쉬운 한국어로 설명하세요.
- 긍정적인 면과 주의할 점을 균형 있게 제시하세요.
- 미래를 확정적으로 단정하지 마세요.
- 공포, 불안, 미신적 확신을 조장하지 마세요.
- 건강은 생활 습관과 에너지 관리 수준의 조언만 제공하세요.
- 재물에 대해서는 투자나 금융상품을 특정하거나 권유하지 마세요.
- 같은 표현을 반복하지 말고 의뢰인의 사주 특징을 반영하세요.

[작성 형식 - 반드시 아래 구조로 작성]
## 🌙 ${name}님의 ${targetYear} 운세

**${targetYear} 기운**
(2~3문장, ${targetYear} 전반적인 운세)

**💼 일과 성취**
(2~3문장)

**💕 관계와 인연**
(2~3문장)

**💰 재물과 흐름**
(2~3문장)

**🌿 건강과 에너지**
(1~2문장)

**✨ 토정 선생의 한마디**
(고전적 지혜가 담긴 따뜻한 조언 1~2문장)

[주의사항]
- 부정적인 표현은 부드럽게 순화
- 구체적이고 실용적인 조언 포함
- 재미있고 읽기 좋게 작성
- 전체 400~500자 내외
`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-5.6-luna',
                messages: [
                    {
                        role: 'system',
                        content: '당신은 토정비결 전문가입니다. 따뜻하고 통찰력 있는 운세를 제공합니다.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.8
            })
        });

        const data = await response.json();

        // OpenAI 에러 처리
        if (!response.ok) {
            console.error('OpenAI Error:', data);
            return res.status(500).json({ error: 'AI 호출 실패' });
        }

        const result = data.choices[0].message.content;
        return res.status(200).json({ result });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}