// 1. จัดการ Modal เพิ่มสินค้า (Add)
const addModal = document.getElementById("addModal");
const addBtn = document.getElementById("openAddModalBtn"); // ID ปุ่มเพิ่มสินค้าด้านบน
const closeAdd = document.querySelector(".close-add");

if(addBtn) {
    addBtn.onclick = () => addModal.style.display = "flex";
}
closeAdd.onclick = () => addModal.style.display = "none";

// 2. จัดการ Modal แก้ไขสินค้า (Edit)
const editModal = document.getElementById("editModal");
const editBtns = document.querySelectorAll(".edit-btn"); // เลือกทุกปุ่มที่มี class นี้
const closeEdit = document.querySelector(".close-edit");

editBtns.forEach(btn => {
    btn.onclick = function() {
        // ดึงข้อมูลจาก data-attributes ของปุ่มที่กด
        const id = this.getAttribute("data-id");
        const name = this.getAttribute("data-name");
        const sku = this.getAttribute("data-sku");

        // นำข้อมูลไปใส่ใน Input ของ Modal แก้ไข
        document.getElementById("edit-id").value = id;
        document.getElementById("edit-name").value = name;
        document.getElementById("edit-sku").value = sku;

        editModal.style.display = "flex";
    }
});

closeEdit.onclick = () => editModal.style.display = "none";

const actionSelect = document.getElementById('action-select');
const qtySection = document.getElementById('quantity-section');
const priceSection = document.getElementById('price-section');

// ฟังก์ชันสำหรับสลับการแสดงผล
function toggleInputs() {
    const action = actionSelect.value;

    if (action === 'update_info') {
        // ถ้าเลือกปรับปรุงข้อมูล -> โชว์ราคา ซ่อนจำนวน
        qtySection.style.display = 'none';
        priceSection.style.display = 'flex';
    } else {
        // ถ้าเลือกเพิ่ม/เบิกสต็อก -> โชว์จำนวน ซ่อนราคา
        qtySection.style.display = 'flex';
        priceSection.style.display = 'none';
    }
}

// ตรวจสอบทุกครั้งที่มีการเปลี่ยนค่าใน Select
actionSelect.addEventListener('change', toggleInputs);

// ตรวจสอบตอนเปิด Modal ครั้งแรกด้วย (เผื่อค่าเริ่มต้นไม่ใช่ update_info)
editBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleInputs(); // รันฟังก์ชันเพื่อตั้งค่าเริ่มต้นให้ Modal
    });
});