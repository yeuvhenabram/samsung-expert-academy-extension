$(document).ready(() => {
    const store = new Storage();

    parallel(Object.keys(STORE), (key, cb) => store.setIfNull(STORE[key], DEFAULTS[key], cb), loadExtension);

    async function loadExtension() {

        // 컨테이너 창을 100%로 유지
        const $container = $('.container.sub');
        if ($container) {
            $container.css('width', '100%');
        }

        /**
         * Problem List Page
         */
        const $searchBar = $('.row.list-navbar-form');
        if ($searchBar.length) {
            // 검색 부분 수정
            $searchBar.css('justify-content', 'flex-end');
            $searchBar.find('.col-lg-3').css('flex', '0');
            $searchBar.find('.col-lg-7').css({
                flex: '0',
                maxWidth: '100%'
            });
            const $difficultyButtons = $searchBar.find('.hidden-sm-down').find('.btn-group');
            $difficultyButtons.children().css({
                width: '100%',
                padding: '3px 5px'
            });
        }

        /**
         * Problem Page
         */
        const $btnRight = $('.btn_right');
        if ($btnRight.length) {
            // "문제 풀기" 버튼
            $('#orderBy').css('width', 'auto');
            $btnRight.find('#mobileSolveBtn').remove();
            $btnRight.find('.hidden_solve_btn')
                .removeClass('hidden_solve_btn');

            // 문제 정보
            const $infoBox = $('.problem_infobox2');
            $infoBox.css({
                width: '100%',
                padding: '15px'
            });
            $infoBox.find('.master').css({
                width: '100px',
                minWidth: '0px'
            });
            $infoBox.find('.info').css('float', 'none');

            // 입출력 박스
            $('.box_type1').children().css('width', 'calc(50% - 15px)');

            // 네비게이션 있는 헤더 조정
            $('.gnb_top').find('.row').css('width', '100%');
            const $headerContainer = $('.gnb-common-inner');
            $headerContainer.css({
                display: 'flex',
                width: '100%'
            });

            // 헤더 맨왼쪽
            const $headerBrand = $headerContainer.find('.navbar-brand');
            $headerBrand.css({
                margin: '10px -30px 0px 0px',
                paddingLeft: '5px'
            });

            // 헤더 중간 메뉴
            const $headerMenu = $headerContainer.find('.navbar-collapse');
            $headerMenu.css({
                maxWidth: '380px',
                marginLeft: '0px'
            });
            $headerMenu.find('.navbar-nav').children().css({
                marginRight: '-30px'
            });

            // 헤더 오른쪽부분
            const $headerRight = $headerContainer.find('.navbar-right');
            $headerRight.css({
                display: 'flex',
                flexGrow: '1',
                justifyContent: 'flex-end'
            });
            const $myLogin = $headerRight.find('.my-login');
            $myLogin.css({
                display: 'flex',
                marginRight: '5px'
            });
            $myLogin.find('.name').css('margin', '6px');
            showSearchIcon();
            $(window).on('resize', showSearchIcon);

            // Problem 메뉴 크기 조정
            const $subHeader = $('.sub_header');
            $subHeader.css('width', '100%');
            $subHeader.find('.code-menu').css('width', '100%');

            // 맨 밑 도움이 되는 문제 크기 조정
            const $helpProblems = $('.tabcon_wrap').find('.state_wrap');
            if ($helpProblems.length) {
                $helpProblems.css('justify-content', 'center');
                $helpProblems.children().css('padding', '5px');
            }
        }


       /**
         * Problem Solving page
         */
        const $left = $('.problem_left');
        const $right = $('.problem_right');
        if ($left.length && $right.length) {
            // 왼쪽 "제출 결과"를 고정 상태에서 메뉴로써 사용할 수 있도록 변경
            $left.css('visibility', 'hidden');
            $right.css({
                'left': '0px',
                'right': '0px',
                'bottom': '0px',
                'padding': '10px'
            });

            // 헤더 부분에 버튼 추가
            const $button = $('<div href="#" class="samsungext-toggle">▶</div>');
            const $header = $('.header');
            $header.css({
                'display': 'flex',
                'align-items': 'center'
            });
            $button.prependTo($header);
            $button.css({
                'flex': 'initial',
                'cursor': 'pointer',
                'text-align': 'center',
                'font-size': '30px',
                'width': '50px',
                'height': '50px',
                'margin-left': '10px'
            });

            // 버튼 추가로 인한 css 수정
            $header.find('h1').css('flex', 'auto');
            $('.club_name').css({
                'position': 'static',
                'margin': '10px 10px 0px'
            });

            // 버튼 클릭 이벤트
            $button.on('click', (e) => {
                e.stopPropagation();
                const $left = $('.problem_left');
                const $right = $('.problem_right');
                if ($left.css('visibility') === 'hidden') {
                    $left.css('visibility', 'visible');
                    $right.css({
                        'left': '385px',
                        'right': '0px',
                        'bottom': '0px'
                    });
                    $button.text('◀');
                } else {
                    $left.css('visibility', 'hidden');
                    $right.css({
                        'left': '0px',
                        'right': '0px',
                        'bottom': '0px'
                    });
                    $button.text('▶');
                }
                return false;
            });
        }

        /**
         * Input/Output Copy function
         */
        const $inOutBox = $('.box_type1').not('.mt-12');

        if ($inOutBox.length) {
            // 입출력 복사하는 부분 추가
            const $copyDescription = $('<span class="copy-description"></span>');
            $copyDescription.insertBefore($inOutBox);

            const $inputBox = $inOutBox.children().first();
            const $outputBox = $inOutBox.children().eq(1);

            // 입력 복사 버튼 추가
            const $inputCopyButton = $('<button>입력 코드 복사</button>');
            $inputCopyButton.appendTo($inputBox.find('.title1'));
            $inputCopyButton.addClass('copy-code-input');
            $inputCopyButton.attr({
                'data-clipboard-target': '.input-code',
                type: 'button'
            });
            $inputCopyButton.css('float', 'right');

            // 출력 복사 버튼 추가
            const $outputCopyButton = $('<button>출력 코드 복사</button>');
            $outputCopyButton.appendTo($outputBox.find('.title1'));
            $outputCopyButton.addClass('copy-code-output');
            $outputCopyButton.attr({
                'data-clipboard-target': '.output-code',
                type: 'button'
            });
            $outputCopyButton.css('float', 'right');

            // TODO: 복사가 실패할 경우 추가
            if ($('.reference_box').length) {
                // 레퍼런스 코드일 경우
                const $inoutBoxes = $inOutBox.find('.box5').find('p');
                const inputText = $inoutBoxes.first().text().replace(/\/[^\n]+/g, '');
                const outputText = $inoutBoxes.eq(1).text().replace(/\/[^\n]+/g, '');

                $(`<span class="input-code" hidden>${inputText}</span>`)
                    .insertBefore($inOutBox);
                setClipboard('.copy-code-input', '입력 복사 완료!!', true);

                $(`<span class="output-code" hidden>${outputText}</span>`)
                    .insertBefore($inOutBox);
                setClipboard('.copy-code-output', '출력 복사 완료!!', true);
            } else {
                // 일반적인 경우 ajax로 파일(input/output.txt)을 다운받아,
                // 따로 span을 생성하여 임시 저장해 둠.
                $.ajax({
                    url: $inputBox.find('.down_area').find('a[href*="?"]').attr('href'),
                    success: (data) => {
                        $(`<span class="input-code" hidden>${data}</span>`)
                            .insertBefore($inOutBox);
                        setClipboard('.copy-code-input', '입력 복사 완료!!', true);
                    }
                });
                $.ajax({
                    url: $outputBox.find('.down_area').find('a[href*="?"]').attr('href'),
                    success: (data) => {
                        $(`<span class="output-code" hidden>${data}</span>`)
                            .insertBefore($inOutBox);
                        setClipboard('.copy-code-output', '출력 복사 완료!!', true);
                    }
                });
            }
        }
    }

    /**
     * 검색 아이콘을 화면 크기에 따라 숨기고 표시하는 jquery 함수
     */
    const showSearchIcon = () => {
        if ($(window).width() < 990) {
            $('.navbar-right').find('.input-icon').hide();
        } else {
            $('.navbar-right').find('.input-icon').show();
        }
    };

    /**
     * 클립보드 객체를 생성하고, 복사에 성공하면 class 속성이 copy-description인
     * html 엘리먼트의 내용을 바꿈.
     * @param what 복사할 css 선택자 이름
     * @param text copy-description class를 가지고 있는 엘리먼트의 텍스트
     * @param isHidden what의 속성 중 hidden이 있으면 true
     */
    const setClipboard = (what, text, isHidden=false) => {
        let inputClipboard;
        if (!isHidden) {
            inputClipboard = new ClipboardJS(what);
        } else {
            inputClipboard = new ClipboardJS(what,
                {
                    text: () => $(what === '.copy-code-input' ?
                        '.input-code' : '.output-code').text()
                });
        }

        inputClipboard.on('success', (e) => {
            $('.copy-description').html(`<b>${text}</b>`);
            /* .
            console.info('Action:', e.action);
            console.info('Text:', e.text);
            console.info('Trigger:', e.trigger);
            */
            e.clearSelection();
        });
    }
});