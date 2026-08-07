-- 게시글 고정(다중 게시판 고정) 기능을 위한 새 테이블.
-- 이 프로젝트는 spring.jpa.hibernate.ddl-auto=validate 라서 엔티티만 추가한다고 테이블이
-- 자동으로 생기지 않습니다. 백엔드를 재시작하기 전에 이 스크립트를 실제 DB에 먼저 실행해주세요.
--
-- 실행 후 백엔드를 재시작하면 PostPin 엔티티(com.example.backend.domain.PostPin)가
-- 이 테이블을 그대로 사용합니다.
--
-- 참고: 예전에 쓰던 post 테이블의 pinned / pin_order 컬럼은 이제 코드에서 더는 사용하지
-- 않습니다. 굳이 지금 지우지 않아도 동작에는 문제없어서(매핑만 안 할 뿐 컬럼 자체는
-- 남아있어도 무해) 이 스크립트에는 포함하지 않았습니다. 나중에 정리하고 싶으시면
-- 아래 별도 문의해주세요.

CREATE TABLE post_pin (
    post_pin_id BIGINT NOT NULL AUTO_INCREMENT,
    post_id     BIGINT NOT NULL,
    board_type  VARCHAR(20) NOT NULL,
    pin_order   INT NOT NULL,
    created_at  DATETIME NOT NULL,
    PRIMARY KEY (post_pin_id),
    UNIQUE KEY uk_post_pin_post_board (post_id, board_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
