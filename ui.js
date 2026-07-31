export function setupAutocomplete(input, cities, onPick) {
    const list = document.createElement("div");
    list.className = "suggestions";
    input.parentNode.append(list);
    input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        list.innerHTML = "";
        if (!query) return;
        cities.filter(city => city.name.toLowerCase().includes(query)).slice(0, 7).forEach(city => {
            const option = document.createElement("button");
            option.textContent = city.name;
            option.onclick = () => { input.value = city.name; list.innerHTML = ""; onPick(); };
            list.append(option);
        });
    });
    input.addEventListener("blur", () => setTimeout(() => { list.innerHTML = ""; }, 150));
}

export function formatHours(hours) {
    const totalMinutes = Math.round(hours * 60);
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}
