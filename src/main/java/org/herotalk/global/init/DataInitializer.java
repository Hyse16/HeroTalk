package org.herotalk.global.init;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.DungeonRepository;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DungeonRepository dungeonRepository;
    private final MonsterRepository monsterRepository;
    private final QuestionRepository questionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (dungeonRepository.count() > 0) {
            log.info("[DataInitializer] 시드 데이터 이미 존재합니다. 건너뜁니다.");
            return;
        }

        log.info("[DataInitializer] 시드 데이터 삽입 시작...");
        List<Dungeon> dungeons = seedDungeons();
        seedMonsters(dungeons);
        seedQuestions();
        log.info("[DataInitializer] 시드 데이터 삽입 완료.");
    }

    private List<Dungeon> seedDungeons() {
        Dungeon d1 = dungeonRepository.save(Dungeon.builder()
                .name("훈련소 숲").description("모험을 시작하는 초보 모험가들의 훈련 공간.")
                .toeicPart(Dungeon.ToeicPart.PART1).requiredLevel(1).region("훈련소").build());
        Dungeon d2 = dungeonRepository.save(Dungeon.builder()
                .name("초보자 숲").description("슬라임과 보스가 사는 입문자 던전.")
                .toeicPart(Dungeon.ToeicPart.PART2).requiredLevel(3).region("초보자 숲").build());
        Dungeon d3 = dungeonRepository.save(Dungeon.builder()
                .name("고블린 던전").description("고블린과 스켈레톤이 지키는 중급 던전.")
                .toeicPart(Dungeon.ToeicPart.PART3).requiredLevel(8).region("고블린 던전").build());
        Dungeon d4 = dungeonRepository.save(Dungeon.builder()
                .name("사막 요새").description("불볕더위 속 오크 전사들의 요새.")
                .toeicPart(Dungeon.ToeicPart.PART4).requiredLevel(15).region("사막 요새").build());
        Dungeon d5 = dungeonRepository.save(Dungeon.builder()
                .name("오크 요새").description("트롤과 오크 워로드가 지배하는 험난한 요새.")
                .toeicPart(Dungeon.ToeicPart.PART5).requiredLevel(22).region("오크 요새").build());
        Dungeon d6 = dungeonRepository.save(Dungeon.builder()
                .name("드래곤 성").description("전설의 드래곤이 기다리는 최후의 던전.")
                .toeicPart(Dungeon.ToeicPart.PART6).requiredLevel(30).region("드래곤 성").build());
        return List.of(d1, d2, d3, d4, d5, d6);
    }

    private void seedMonsters(List<Dungeon> dungeons) {
        Dungeon d1 = dungeons.get(0); // 훈련소 숲
        Dungeon d2 = dungeons.get(1); // 초보자 숲
        Dungeon d3 = dungeons.get(2); // 고블린 던전
        Dungeon d4 = dungeons.get(3); // 사막 요새
        Dungeon d5 = dungeons.get(4); // 오크 요새
        Dungeon d6 = dungeons.get(5); // 드래곤 성

        monsterRepository.saveAll(List.of(
            // 훈련소 숲 (PART1)
            Monster.builder().dungeon(d1).name("이끼 골렘").monsterType(Monster.MonsterType.NORMAL)
                .hp(100).attackPower(5).expReward(50).goldReward(10)
                .toeicPart(Dungeon.ToeicPart.PART1).difficulty(1).build(),

            // 초보자 숲 (PART2)
            Monster.builder().dungeon(d2).name("슬라임").monsterType(Monster.MonsterType.NORMAL)
                .hp(200).attackPower(10).expReward(100).goldReward(15)
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(1).build(),
            Monster.builder().dungeon(d2).name("고블린 킹").monsterType(Monster.MonsterType.BOSS)
                .hp(1000).attackPower(30).expReward(1000).goldReward(150)
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(2).build(),

            // 고블린 던전 (PART3)
            Monster.builder().dungeon(d3).name("고블린").monsterType(Monster.MonsterType.NORMAL)
                .hp(350).attackPower(20).expReward(175).goldReward(20)
                .toeicPart(Dungeon.ToeicPart.PART3).difficulty(2).build(),
            Monster.builder().dungeon(d3).name("스켈레톤").monsterType(Monster.MonsterType.NORMAL)
                .hp(350).attackPower(25).expReward(175).goldReward(22)
                .toeicPart(Dungeon.ToeicPart.PART3).difficulty(2).build(),
            Monster.builder().dungeon(d3).name("다크 나이트").monsterType(Monster.MonsterType.BOSS)
                .hp(1200).attackPower(45).expReward(1200).goldReward(200)
                .toeicPart(Dungeon.ToeicPart.PART3).difficulty(3).build(),

            // 사막 요새 (PART4)
            Monster.builder().dungeon(d4).name("오크").monsterType(Monster.MonsterType.NORMAL)
                .hp(500).attackPower(35).expReward(250).goldReward(30)
                .toeicPart(Dungeon.ToeicPart.PART4).difficulty(3).build(),
            Monster.builder().dungeon(d4).name("사막 군주").monsterType(Monster.MonsterType.BOSS)
                .hp(1400).attackPower(55).expReward(1400).goldReward(250)
                .toeicPart(Dungeon.ToeicPart.PART4).difficulty(4).build(),

            // 오크 요새 (PART5)
            Monster.builder().dungeon(d5).name("트롤").monsterType(Monster.MonsterType.NORMAL)
                .hp(600).attackPower(45).expReward(300).goldReward(38)
                .toeicPart(Dungeon.ToeicPart.PART5).difficulty(4).build(),
            Monster.builder().dungeon(d5).name("오크 워로드").monsterType(Monster.MonsterType.BOSS)
                .hp(1500).attackPower(65).expReward(1500).goldReward(280)
                .toeicPart(Dungeon.ToeicPart.PART5).difficulty(5).build(),

            // 드래곤 성 (PART6)
            Monster.builder().dungeon(d6).name("와이번").monsterType(Monster.MonsterType.NORMAL)
                .hp(750).attackPower(55).expReward(375).goldReward(48)
                .toeicPart(Dungeon.ToeicPart.PART6).difficulty(5).build(),
            Monster.builder().dungeon(d6).name("드래곤").monsterType(Monster.MonsterType.BOSS)
                .hp(2000).attackPower(80).expReward(2000).goldReward(300)
                .toeicPart(Dungeon.ToeicPart.PART6).difficulty(6).build()
        ));
    }

    private void seedQuestions() {
        questionRepository.saveAll(List.of(

            // ─── PART 1: Read a text aloud ───────────────────────────────────────
            Question.builder().toeicPart(Dungeon.ToeicPart.PART1).difficulty(1)
                .questionText("다음 문장을 크고 명확하게 읽으세요.\n\n" +
                    "\"The quarterly sales report indicates a significant increase in revenue " +
                    "compared to last year. Our marketing team has done an exceptional job " +
                    "attracting new customers to our platform.\"")
                .prepTime(45).answerTime(45)
                .hint("분기(quarterly), 수익(revenue), 마케팅팀(marketing team) 키워드에 집중하세요.")
                .sampleAnswer("The quarterly sales report indicates a significant increase in revenue " +
                    "compared to last year. Our marketing team has done an exceptional job " +
                    "attracting new customers to our platform.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART1).difficulty(1)
                .questionText("다음 문장을 크고 명확하게 읽으세요.\n\n" +
                    "\"Please be aware that the conference room on the third floor will be " +
                    "unavailable from Monday through Wednesday due to scheduled maintenance work. " +
                    "We apologize for any inconvenience this may cause.\"")
                .prepTime(45).answerTime(45)
                .hint("회의실(conference room), 3층(third floor), 유지보수(maintenance) 단어를 정확히 발음하세요.")
                .sampleAnswer("Please be aware that the conference room on the third floor will be " +
                    "unavailable from Monday through Wednesday due to scheduled maintenance work. " +
                    "We apologize for any inconvenience this may cause.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART1).difficulty(1)
                .questionText("다음 문장을 크고 명확하게 읽으세요.\n\n" +
                    "\"We are pleased to announce that our company has recently partnered with " +
                    "several international organizations to expand our services to customers " +
                    "in more than thirty countries worldwide.\"")
                .prepTime(45).answerTime(45)
                .hint("announced(발표), partnered(제휴), international(국제) 표현을 자연스럽게 연결하세요.")
                .sampleAnswer("We are pleased to announce that our company has recently partnered with " +
                    "several international organizations to expand our services to customers " +
                    "in more than thirty countries worldwide.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART1).difficulty(2)
                .questionText("다음 문장을 크고 명확하게 읽으세요.\n\n" +
                    "\"Passengers are reminded that all carry-on luggage must be stored in the " +
                    "overhead compartment or under the seat in front of you before takeoff. " +
                    "Thank you for your cooperation.\"")
                .prepTime(45).answerTime(45)
                .hint("기내 안내 방송 형식입니다. carry-on, overhead compartment, takeoff 발음에 주의하세요.")
                .sampleAnswer("Passengers are reminded that all carry-on luggage must be stored in the " +
                    "overhead compartment or under the seat in front of you before takeoff. " +
                    "Thank you for your cooperation.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART1).difficulty(2)
                .questionText("다음 문장을 크고 명확하게 읽으세요.\n\n" +
                    "\"The new employee orientation program will take place next Tuesday at nine " +
                    "o'clock in the morning. All new hires are required to attend and should " +
                    "bring a valid photo identification.\"")
                .prepTime(45).answerTime(45)
                .hint("orientation, identification 같은 긴 단어는 천천히 또박또박 읽으세요.")
                .sampleAnswer("The new employee orientation program will take place next Tuesday at nine " +
                    "o'clock in the morning. All new hires are required to attend and should " +
                    "bring a valid photo identification.")
                .build(),

            // ─── PART 2: Describe a picture ──────────────────────────────────────
            Question.builder().toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("[사진 묘사] 다음 상황을 영어로 묘사하세요.\n\n" +
                    "📷 상황: 한 여성이 카페에서 노트북으로 작업하고 있습니다. " +
                    "테이블 위에는 커피잔이 있고, 창문으로 햇빛이 들어오고 있습니다.")
                .prepTime(30).answerTime(45)
                .hint("A woman is working... / On the table there is... / Sunlight is coming through... 구조로 시작해보세요.")
                .sampleAnswer("In this picture, a woman is sitting at a café table and working on her laptop. " +
                    "There is a cup of coffee on the table in front of her. " +
                    "Sunlight is streaming through the window, creating a bright and comfortable atmosphere.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("[사진 묘사] 다음 상황을 영어로 묘사하세요.\n\n" +
                    "📷 상황: 회의실에서 여러 사람들이 테이블 주위에 앉아 발표를 듣고 있습니다. " +
                    "화이트보드에는 차트가 그려져 있고, 발표자가 서 있습니다.")
                .prepTime(30).answerTime(45)
                .hint("Several people are seated... / A presenter is standing... / There are charts on... 으로 시작해보세요.")
                .sampleAnswer("In this picture, several people are seated around a conference table, " +
                    "listening to a presentation. A presenter is standing near a whiteboard " +
                    "that has charts and graphs drawn on it. The meeting appears to be a business discussion.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART2).difficulty(2)
                .questionText("[사진 묘사] 다음 상황을 영어로 묘사하세요.\n\n" +
                    "📷 상황: 공원에서 두 명의 사람이 벤치에 앉아 대화를 나누고 있습니다. " +
                    "주변에는 나무들이 있고, 한 사람은 책을 들고 있습니다.")
                .prepTime(30).answerTime(45)
                .hint("Two people are sitting... / They appear to be... / In the background... 구조를 활용하세요.")
                .sampleAnswer("In this picture, two people are sitting on a bench in a park, having a conversation. " +
                    "One of them is holding a book. Trees and greenery surround them, " +
                    "and the overall atmosphere looks relaxed and pleasant.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART2).difficulty(2)
                .questionText("[사진 묘사] 다음 상황을 영어로 묘사하세요.\n\n" +
                    "📷 상황: 슈퍼마켓에서 직원이 선반에 물건을 진열하고 있습니다. " +
                    "선반은 다양한 상품들로 가득 차 있고, 몇몇 손님들이 쇼핑 중입니다.")
                .prepTime(30).answerTime(45)
                .hint("An employee is stocking... / The shelves are filled with... / Some customers are... 순서로 묘사하세요.")
                .sampleAnswer("In this photo, a store employee is stocking shelves with various products. " +
                    "The shelves are already filled with a wide variety of items. " +
                    "In the background, a few customers can be seen shopping in the store.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART2).difficulty(3)
                .questionText("[사진 묘사] 다음 상황을 영어로 묘사하세요.\n\n" +
                    "📷 상황: 공항 출발 라운지에서 승객들이 탑승을 기다리고 있습니다. " +
                    "일부는 좌석에 앉아 있고, 일부는 서서 휴대폰을 보고 있습니다.")
                .prepTime(30).answerTime(45)
                .hint("In an airport departure lounge... / Some passengers are... / Others are standing... 으로 시작하세요.")
                .sampleAnswer("This picture shows a busy airport departure lounge. " +
                    "Several passengers are waiting to board their flight. " +
                    "Some of them are seated, while others are standing and looking at their mobile phones. " +
                    "The overall atmosphere suggests that a flight is about to depart.")
                .build(),

            // ─── PART 3: Respond to questions ────────────────────────────────────
            Question.builder().toeicPart(Dungeon.ToeicPart.PART3).difficulty(2)
                .questionText("다음 질문에 영어로 답하세요.\n\n" +
                    "Q: What do you usually do on weekends?")
                .prepTime(3).answerTime(15)
                .hint("I usually... / On weekends, I like to... / My favorite weekend activity is... 로 시작하세요.")
                .sampleAnswer("On weekends, I usually like to relax at home or go out with friends. " +
                    "I enjoy reading books and watching movies. Sometimes I go hiking to enjoy nature.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART3).difficulty(2)
                .questionText("다음 질문에 영어로 답하세요.\n\n" +
                    "Q: What kind of food do you enjoy eating?")
                .prepTime(3).answerTime(15)
                .hint("I enjoy... / My favorite food is... / I prefer... because... 구조를 사용하세요.")
                .sampleAnswer("I enjoy eating a variety of foods, but my favorite is Korean food. " +
                    "I especially love bibimbap and bulgogi. I also enjoy trying different cuisines " +
                    "from around the world, like Italian pasta and Japanese sushi.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART3).difficulty(2)
                .questionText("다음 질문에 영어로 답하세요.\n\n" +
                    "Q: How do you usually get to work or school?")
                .prepTime(3).answerTime(15)
                .hint("I usually take... / I commute by... / It takes about... minutes to get there.")
                .sampleAnswer("I usually take the subway to get to work. It takes about 30 minutes. " +
                    "I find it convenient because I don't have to worry about traffic. " +
                    "Sometimes I listen to music or read news on my phone during the commute.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART3).difficulty(3)
                .questionText("다음 질문에 영어로 답하세요.\n\n" +
                    "Q: What qualities do you think are most important in a good leader?")
                .prepTime(3).answerTime(15)
                .hint("I think a good leader should... / The most important quality is... / For example...")
                .sampleAnswer("I think the most important quality in a good leader is the ability to communicate clearly. " +
                    "A good leader should also be empathetic and able to motivate team members. " +
                    "Strong decision-making skills are also essential for leading a team effectively.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART3).difficulty(3)
                .questionText("다음 질문에 영어로 답하세요.\n\n" +
                    "Q: Describe a memorable travel experience you have had.")
                .prepTime(3).answerTime(15)
                .hint("One memorable trip was... / I visited... / The most exciting part was...")
                .sampleAnswer("One of my most memorable travel experiences was visiting Jeju Island. " +
                    "I went with my family and we hiked Hallasan Mountain. " +
                    "The view from the top was breathtaking, and it was a great bonding experience.")
                .build(),

            // ─── PART 4: Respond using information provided ──────────────────────
            Question.builder().toeicPart(Dungeon.ToeicPart.PART4).difficulty(3)
                .questionText("[표 활용 답변] 다음 정보를 바탕으로 질문에 답하세요.\n\n" +
                    "📋 회사 워크샵 일정:\n" +
                    "- 날짜: 2024년 3월 15일 (금요일)\n" +
                    "- 장소: 서울 그랜드 호텔 3층 컨퍼런스룸\n" +
                    "- 시작시간: 오전 9시\n" +
                    "- 점심: 오후 12시 30분 (뷔페)\n" +
                    "- 종료: 오후 5시\n\n" +
                    "Q: What time does the workshop start, and where will lunch be served?")
                .prepTime(45).answerTime(30)
                .hint("The workshop starts at... / Lunch will be served at... / It will be held at...")
                .sampleAnswer("The workshop starts at 9 o'clock in the morning. " +
                    "Lunch will be served at 12:30 in the afternoon, and it will be a buffet-style meal.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART4).difficulty(3)
                .questionText("[표 활용 답변] 다음 정보를 바탕으로 질문에 답하세요.\n\n" +
                    "📋 신제품 출시 정보:\n" +
                    "- 제품명: ProMax X500\n" +
                    "- 출시일: 2024년 4월 1일\n" +
                    "- 가격: 89,000원\n" +
                    "- 주요 특징: 방수 기능, 배터리 72시간, 블루투스 5.0\n" +
                    "- 보증기간: 2년\n\n" +
                    "Q: What are the main features of the ProMax X500, and how long is the warranty?")
                .prepTime(45).answerTime(30)
                .hint("The main features include... / The warranty period is... / It also has...")
                .sampleAnswer("The main features of the ProMax X500 include waterproof capability, " +
                    "a 72-hour battery life, and Bluetooth 5.0 technology. " +
                    "The product comes with a two-year warranty.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART4).difficulty(4)
                .questionText("[표 활용 답변] 다음 정보를 바탕으로 질문에 답하세요.\n\n" +
                    "📋 비행 일정:\n" +
                    "- 항공편: KA 305\n" +
                    "- 출발: 인천국제공항 (오전 10:40)\n" +
                    "- 도착: 도쿄 나리타 (오후 12:55)\n" +
                    "- 탑승구: B22\n" +
                    "- 탑승 시작: 오전 10:10\n\n" +
                    "Q: What time should passengers be at gate B22, and when does the flight arrive in Tokyo?")
                .prepTime(45).answerTime(30)
                .hint("Passengers should be at the gate by... / The flight arrives in Tokyo at...")
                .sampleAnswer("Passengers should be at gate B22 by 10:10 in the morning, " +
                    "as boarding begins at that time. " +
                    "The flight is scheduled to arrive in Tokyo at 12:55 in the afternoon.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART4).difficulty(4)
                .questionText("[표 활용 답변] 다음 정보를 바탕으로 질문에 답하세요.\n\n" +
                    "📋 직원 교육 프로그램:\n" +
                    "- 과정명: Advanced Excel Training\n" +
                    "- 강사: Kim Jiyoung 과장\n" +
                    "- 날짜: 매주 화요일, 목요일\n" +
                    "- 시간: 오후 2시 ~ 4시\n" +
                    "- 장소: 교육실 201호\n" +
                    "- 정원: 15명\n\n" +
                    "Q: Who is the instructor for the Advanced Excel Training, and how many people can attend?")
                .prepTime(45).answerTime(30)
                .hint("The instructor is... / The training can accommodate up to... participants.")
                .sampleAnswer("The instructor for the Advanced Excel Training is Kim Jiyoung, a manager. " +
                    "The training can accommodate up to 15 participants per session.")
                .build(),

            // ─── PART 5: Propose a solution ──────────────────────────────────────
            Question.builder().toeicPart(Dungeon.ToeicPart.PART5).difficulty(4)
                .questionText("[해결책 제안] 다음 상황을 듣고 해결책을 제안하세요.\n\n" +
                    "📢 상황: 당신은 팀 프로젝트 매니저입니다. 팀원 한 명이 갑자기 병으로 " +
                    "2주간 결근하게 되었습니다. 중요한 발표 일정이 일주일 후로 예정되어 있습니다.\n\n" +
                    "이 문제를 어떻게 해결하시겠습니까?")
                .prepTime(30).answerTime(60)
                .hint("First, I would... / To solve this problem, I suggest... / Additionally, we could...")
                .sampleAnswer("First, I would assess which tasks the absent team member was responsible for " +
                    "and redistribute them among the remaining team members based on their availability and skills. " +
                    "I would also consider asking management to temporarily assign additional staff to our team. " +
                    "Additionally, I would communicate clearly with stakeholders about any potential changes " +
                    "to the presentation scope, and prioritize the most critical components to ensure we meet the deadline.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART5).difficulty(4)
                .questionText("[해결책 제안] 다음 상황을 듣고 해결책을 제안하세요.\n\n" +
                    "📢 상황: 당신은 카페 매니저입니다. 주요 커피 공급업체가 갑자기 공급을 " +
                    "중단했고, 재고는 3일치밖에 남지 않았습니다.\n\n" +
                    "이 상황을 어떻게 해결하시겠습니까?")
                .prepTime(30).answerTime(60)
                .hint("I would immediately contact... / As a temporary solution... / In the long term...")
                .sampleAnswer("I would immediately contact other coffee suppliers to find an alternative source. " +
                    "I would compare prices and quality, and place an emergency order with the best available supplier. " +
                    "As a temporary solution, I would inform our customers about the limited coffee options " +
                    "and promote alternative beverages on our menu. " +
                    "In the long term, I would diversify our suppliers to prevent this situation from happening again.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART5).difficulty(5)
                .questionText("[해결책 제안] 다음 상황을 듣고 해결책을 제안하세요.\n\n" +
                    "📢 상황: 당신은 IT 회사의 고객 서비스 팀장입니다. 최근 고객 불만 건수가 " +
                    "3개월 연속 증가하고 있으며, 주요 불만 원인은 응답 시간 지연입니다.\n\n" +
                    "이 문제를 해결하기 위한 구체적인 방안을 제시하세요.")
                .prepTime(30).answerTime(60)
                .hint("The root cause of this issue... / My proposed solution involves... / I would implement...")
                .sampleAnswer("To address the increasing customer complaints about response time, " +
                    "I would first analyze our current workflow to identify bottlenecks. " +
                    "I would then implement a priority-based ticketing system to ensure urgent issues are handled first. " +
                    "Additionally, I would hire additional support staff during peak hours " +
                    "and introduce automated responses for common queries using AI chatbots. " +
                    "Finally, I would establish clear response time targets and track our performance weekly " +
                    "to ensure continuous improvement.")
                .build(),

            // ─── PART 6: Express an opinion ──────────────────────────────────────
            Question.builder().toeicPart(Dungeon.ToeicPart.PART6).difficulty(5)
                .questionText("[의견 제시] 다음 주제에 대한 의견을 말하세요.\n\n" +
                    "💬 주제: 재택근무(Work from home)가 사무실 근무보다 생산성이 높다고 생각하십니까?")
                .prepTime(15).answerTime(60)
                .hint("In my opinion... / I believe that... because... / On the other hand... / In conclusion...")
                .sampleAnswer("In my opinion, working from home can be more productive than working in an office " +
                    "for many people, depending on the nature of their work. " +
                    "When people work from home, they can avoid long commutes and create their own optimal work environment, " +
                    "which can lead to greater focus and efficiency. " +
                    "However, I also recognize that some people struggle with distractions at home " +
                    "and may miss the collaborative energy of an office setting. " +
                    "Therefore, I believe a hybrid model that combines both options would be the most effective approach.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART6).difficulty(5)
                .questionText("[의견 제시] 다음 주제에 대한 의견을 말하세요.\n\n" +
                    "💬 주제: 대학 교육이 성공적인 커리어를 위해 반드시 필요하다고 생각하십니까?")
                .prepTime(15).answerTime(60)
                .hint("I think... / While it is true that... / However... / Based on this, I would argue...")
                .sampleAnswer("I believe that while a university education can be very valuable, " +
                    "it is not necessarily required for a successful career in all fields. " +
                    "A degree provides structured learning, networking opportunities, and credibility in many industries. " +
                    "However, with the rise of online learning platforms and the growing emphasis on practical skills, " +
                    "many people have built successful careers without a traditional degree. " +
                    "I think what matters most is the ability to continuously learn, adapt, and demonstrate your value.")
                .build(),

            Question.builder().toeicPart(Dungeon.ToeicPart.PART6).difficulty(6)
                .questionText("[의견 제시] 다음 주제에 대한 의견을 말하세요.\n\n" +
                    "💬 주제: 소셜 미디어가 현대 사회에 미치는 긍정적인 영향과 부정적인 영향에 대해 " +
                    "균형 잡힌 의견을 제시하세요.")
                .prepTime(15).answerTime(60)
                .hint("Social media has both positive and negative... / On one hand... / On the other hand... / Overall...")
                .sampleAnswer("Social media has had a profound impact on modern society, both positively and negatively. " +
                    "On the positive side, it has enabled people to stay connected with friends and family worldwide, " +
                    "democratized the sharing of information, and provided platforms for social movements and businesses. " +
                    "On the other hand, it has also contributed to the spread of misinformation, cyberbullying, " +
                    "and concerns about privacy and mental health, particularly among young people. " +
                    "Overall, I believe social media is a powerful tool that requires thoughtful use and regulation " +
                    "to maximize its benefits while minimizing its harms.")
                .build()
        ));
    }
}
