export default async function handler(req, res) {

    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not configured');
        return res.status(500).json({ error: 'OpenAI API 키가 설정되지 않았습니다.' });
    }

    const { name, targetYear,birthdate, calendarType, gender, birthHour } = req.body;

    // 입력값 검증
    if (!name || !birthdate || !gender) {
        return res.status(400).json({ error: '필수 입력값이 없습니다.' });
    }

    // 프롬프트 만들기
    const hourText = birthHour ? `태어난 시: ${birthHour}시` : '태어난 시: 미상';
    const calendarText = calendarType === 'lunar' ? '음력(평달)' : calendarType === 'lunar-leap' ? '음력(윤달)' : '양력';

    const prompt = `
당신은 조선시대 토정 이지함의 지혜를 현대적으로 해석하는 운세 전문가입니다.
이지함 선생의 마음처럼 따뜻하고 인문학적인 말투로, 아래 정보를 바탕으로 토정비결식 운세를 풀어주세요.

[의뢰인 정보]
- 이름: ${name}
- 궁금한 시기: ${targetYear}
- 생년월일: ${birthdate} (${calendarText})
- 성별: ${gender}
- ${hourText}

아래 구조의 개인 맞춤형 운세 리포트로 작성해주세요.
각 항목은 서로 다른 내용을 다루고, 의뢰인의 정보와 ${targetYear}의 흐름이 자연스럽게 연결되도록 설명해주세요.

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

[작성 형식 - 반드시 아래 구조와 순서를 지켜 작성]
**${targetYear}의 전체적인 기운**
(${targetYear}의 전반적인 흐름을 3~4문장으로 요약)

**💼 일과 성취**
(업무, 학업, 목표 달성에 관한 흐름과 실천 조언을 4~5문장으로 작성)

**💕 관계와 인연**
(가족, 친구, 동료 및 새로운 인연에 관한 흐름과 관계 조언을 2~3문장으로 작성)

**💰 재물과 흐름**
(수입과 지출의 흐름, 계획적인 재정 관리에 관한 조언을 4~5문장으로 작성)

**🌿 건강과 에너지**
(생활 습관과 컨디션 관리에 관한 현실적인 조언을 1~2문장으로 작성)

**🗓️ ${targetYear} 월별 운세 흐름**
(각 월별로 2~3문장씩 작성하고, 각 달의 흐름과 실천 키워드를 포함)
•1월: (내용)
•2월: (내용)
•3월: (내용)
•4월: (내용)
•5월: (내용)
•6월: (내용)
•7월: (내용)
•8월: (내용)
•9월: (내용)
•10월: (내용)
•11월: (내용)
•12월: (내용)

**✨ 토정 살롱의 한마디**
(${targetYear}를 준비하는 데 도움이 되는 품위 있고 따뜻한 조언을 2~3문장으로 작성)
`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4.1-nano',
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

        const result = data.choices?.[0]?.message?.content;
        if (!result) {
            console.error('OpenAI response did not include a result:', data);
            return res.status(500).json({ error: 'AI 응답 형식이 올바르지 않습니다.' });
        }
        return res.status(200).json({ result });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}