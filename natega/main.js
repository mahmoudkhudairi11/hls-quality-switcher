(async function () {
  async function open() {
    let {version: v} = (await indexedDB.databases()).find(d => d.name == "natega-db") || {version: 0};
    let req = indexedDB.open("natega-db", localStorage.noMoreUpgrades ? v : v + 1);
    await new Promise(rs => req.addEventListener(localStorage.noMoreUpgrades ? "success" : "upgradeneeded", rs));
    return req;
  }
  let {result: db, transaction: tr} = await open();
  async function createObjectStore(db, n) {
    db.createObjectStore(n, {keyPath: "sitNum"});
  }
  async function count(n) {
    let req = db.transaction(n).objectStore(n).count();
    await new Promise(rs => req.addEventListener("success", rs));
    return req.result;
  }
  async function add(n, entry) {
    let req = db.transaction(n, "readwrite").objectStore(n).add(entry);
    await new Promise(rs => req.addEventListener("success", rs));
  }
  async function get(n, sitNum) {
    let req = db.transaction(n, "readwrite").objectStore(n).get(sitNum);
    await new Promise(rs => req.addEventListener("success", rs));
    return req.result;
  }
  let gds = [4, 5, 6];
  if (!localStorage.noMoreUpgrades) {
    let lts = {4: 185, 5: 162, 6: 179};
    for (let g of gds) {
      if (!db.objectStoreNames.contains(`grade-${g}`)) createObjectStore(db, `grade-${g}`);
    }
    await new Promise(rs => tr.addEventListener("complete", rs));
    for (let g of gds) {
      if (await count(`grade-${g}`) != lts[g]) {
        let data = await (await fetch(`grades/${g}.json`)).json();
        for (let student of data) await add(`grade-${g}`, student);
      }
    }
    if (gds.every(async g => count(`grade-${g}`) == lts[g])) localStorage.noMoreUpgrades = true;  
  }
  document.body.classList.remove("downloading");
  if (!window?.localStorage?.sitAlert) {
    alert("الرجاء التأكد من كتابة رقم الجلوس باللغة الإنجليزية");
    if (window.localStorage) window.localStorage.sitAlert = true;
  }
  var
    sitNum = document.querySelector(".sit-num"),
    grade  = document.querySelector(".grade"),
    submit = document.querySelector(".submit"),
    natega = document.querySelector(".natega");
  sitNum.addEventListener("input", function () {
    submit.disabled = !this.value.length || !+grade.value;
  });
  sitNum.addEventListener("keydown", function (e) {
    if (!+this.value || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.code == "ArrowUp" || e.code == "ArrowDown" || e.code == "Enter") {
      e.preventDefault();
      submit.disabled = !sitNum.value.length || !+this.value;
    }
    if (e.code == "Enter") submit.click();
    if (e.code == "ArrowUp") this.value++;
    if (e.code == "ArrowDown" && this.value > 1) this.value--;
  });
  sitNum.addEventListener("change", function () {
    if (!window.sessionStorage) return;
    window.sessionStorage.sitNum = this.value;
  });
  grade.addEventListener("change", function () {
    submit.disabled = !sitNum.value.length || !+this.value;
    if (!window.sessionStorage) return;
    window.sessionStorage.grade = this.value;
  });
  grade.addEventListener("change", function () {
    if (!window.sessionStorage) return;
    if (!isFinite(this.value)) this.options[0].remove();
  }, {once: 1});
  sitNum.value = window?.sessionStorage?.sitNum || sitNum.value;
  grade.value = window?.sessionStorage?.grade || grade.value;
  if (isFinite(grade.value)) grade.options[0].remove();
  submit.disabled = !sitNum.value.length || !+grade.value;
  function setNatega(data, error) {
    natega.innerHTML = data;
    natega.classList[error ? "add" : "remove"]("error");
  }
  function checkFail(data) {
    return data.fail ? ` class="fail" `: "";
  }
  submit.addEventListener("click", async function () {
    if (!sitNum.value.length) return setNatega(`الرجاء إدخال رقم الجلوس`, 1);
    if (!+sitNum.value) return setNatega(`الرجاء إدخال رقم جلوس صحيح`, 1);
    if (!+grade.value) return setNatega(`الرجاء تحديد الصف الدراسي`, 1);
    if (!gds.includes(+grade.value)) return setNatega(`هذا الفصل غير موجود`, 1);
    let student = await get(`grade-${grade.value}`, +sitNum.value);
    if (!student) return setNatega("لا يوجد طالب بهذا الرقم", 1);
    this.disabled = true;
    if (grade.value == "5" || grade.value == "6") setNatega(
`<table>
  <tr>
    <th colspan="2" class="section">بيانات الطالب</th>
  </tr>
  <tr>
    <th>الاسم</th>
    <td>${student.name}</td>
  </tr>
  <tr>
    <th>رقم الجلوس</th>
    <td>${student.sitNum}</td>
  </tr>
  <tr>
    <th>الحالة</th>
    ${
      student.total.value == "غ" ?
      `<td class="fail">${student.status.text}</td>`
      :
      `<td${checkFail(student.total.rate)}>${student.status.text}</td>`
    }
  </tr>
  <tr>
    <th>المجموع الكلي</th>
    ${
      student.total.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.total.rate)}>${student.total.value} من 300 | ${student.total.rate.text}</td>`
    }
  </tr>
  <tr>
    <th>النسبة المئوية</th>
    ${
      student.total.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td>%${(student.total.value / 300 * 100).toFixed(2)}</td>`
    }
  </tr>
  <tr>
    <th colspan="2" class="section">درجات الطالب</th>
  </tr>
  <tr>
    <th>لغة عربية</th>
    ${
      student.arabic.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.arabic.rate)}>${student.arabic.value} من 100 | ${student.arabic.rate.text}</td>`
    }
  </tr>
  <tr>
    <th>رياضيات</th>
    ${
      student.math.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.math.rate)}>${student.math.value} من 80 | ${student.math.rate.text}</td>`
    }
  </tr>
  <tr>
    <th>دراسات إجتماعية</th>
    ${
      student.studies.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.studies.rate)}>${student.studies.value} من 40 | ${student.studies.rate.text}</td>`
    }
  </tr>
  <tr>
    <th>علوم</th>
    ${
      student.sciences.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.sciences.rate)}>${student.sciences.value} من 40 | ${student.sciences.rate.text}</td>`
    }
  </tr>
  <tr>
    <th>لغة إنجليزية</th>
    ${
      student.english.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.english.rate)}>${student.english.value} من 40 | ${student.english.rate.text}</td>`
    }
  </tr>
  <tr>
    <th colspan="2" class="section">مواد خارج المجموع</th>
  </tr>
  <tr>
    <th>نشاط إختياري 1</th>
    ${
      student.a1.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.a1.rate)}>${student.a1.value} من 20 | ${student.a1.rate.text}</td>`
    }
  </tr>
  <tr>
    <th>نشاط إختياري 2</th>
    ${
      student.a2.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.a2.rate)}>${student.a2.value} من 20 | ${student.a2.rate.text}</td>`
    }
  </tr>
  <tr>
    <th>تربية رياضية</th>
    ${
      student.aSport.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.aSport.rate)}>${student.aSport.value} من 20 | ${student.aSport.rate.text}</td>`
    }
  </tr>
  <tr>
    <th>نشاط فني</th>
    ${
      student.aArt.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.aArt.rate)}>${student.aArt.value} من 20 | ${student.aArt.rate.text}</td>`
    }
  </tr>
  <tr>
    <th>تربية دينية</th>
    ${
      student.religious.value == "غ" ?
      `<td class="fail">غائب</td>`
      :
      `<td${checkFail(student.religious.rate)}>${student.religious.value} من 40 | ${student.religious.rate.text}</td>`
    }
  </tr>
</table>`
    );
    if (grade.value == "4") setNatega(
`<h5 style="margin:0">التقديرات:</h5><div class="color-explain">
  <div class="entry">يفوق التوقعات</div>
  <div class="entry">يمتلك المهارات والمعارف</div>
  <div class="entry">يحتاج إلى بعض الدعم</div>
  <div class="entry">يحتاج إلى مزيد من الدعم</div>
</div>
<table>
  <tr>
    <th colspan="2" class="section">بيانات الطالب</th>
  </tr>
  <tr>
    <th>الاسم</th>
    <td>${student.name}</td>
  </tr>
  <tr>
    <th>رقم الجلوس</th>
    <td>${student.sitNum}</td>
  </tr>
  <tr>
    <th>الحالة</th>
    <td>${student.status}</td>
  </tr>
  <tr>
    <th>المجموع</th>
    <td style="background-color: ${student.total}"></td>
  </tr>
  <tr>
    <th colspan="2" class="section">تقديرات الطالب</th>
  </tr>
  <tr>
    <th>لغة عربية</th>
    <td style="background-color: ${student.arabic}"></td>
  </tr>
  <tr>
    <th>رياضيات</th>
    <td style="background-color: ${student.math}"></td>
  </tr>
  <tr>
    <th>دراسات</th>
    <td style="background-color: ${student.studies}"></td>
  </tr>
  <tr>
    <th>علوم</th>
    <td style="background-color: ${student.sciences}"></td>
  </tr>
  <tr>
    <th>لغة إنجليزية</th>
    <td style="background-color: ${student.english}"></td>
  </tr>
  <tr>
    <th>تربية دينية</th>
    <td style="background-color: ${student.religious}"></td>
  </tr>
  <tr>
    <th>تكنولوجيا المعلومات</th>
    <td style="background-color: ${student.it}"></td>
  </tr>
  <tr>
    <th>مهارات مهنية</th>
    <td style="background-color: ${student.ps}"></td>
  </tr>
  <tr>
    <th colspan="2" class="section">مواد خارج المجموع</th>
  </tr>
  <tr>
    <th>تربية فنية</th>
    <td style="background-color: ${student.aArt}"></td>
  </tr>
  <tr>
    <th>تربية رياضية</th>
    <td style="background-color: ${student.aSport}"></td>
  </tr>
  <tr>
    <th>تربية موسيقية</th>
    <td style="background-color: ${student.aMusic}"></td>
  </tr>
  <tr>
    <th>توكاتسو</th>
    <td style="background-color: ${student.tokatsu}"></td>
  </tr>
  <tr>
    <th>القيم و احترام الآخر</th>
    <td style="background-color: ${student.vro}"></td>
  </tr>
</table>`
    );
  });
})();