document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  function createTextElement(tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
  }

  async function unregisterParticipant(activityName, email) {
    const response = await fetch(
      `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
      { method: "DELETE" }
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || "Unable to unregister participant");
    }
    showMessage(result.message, "success");
    await fetchActivities();
  }

  function createParticipantList(activityName, participants) {
    const section = document.createElement("div");
    section.className = "participants";
    section.appendChild(createTextElement("strong", "Participants"));

    if (participants.length === 0) {
      section.appendChild(createTextElement("p", "No participants yet."));
      return section;
    }

    const list = document.createElement("ul");
    participants.forEach((email) => {
      const item = document.createElement("li");
      item.appendChild(createTextElement("span", email));

      const button = document.createElement("button");
      button.type = "button";
      button.className = "unregister-button";
      button.setAttribute("aria-label", `Unregister ${email}`);
      button.textContent = "×";
      button.addEventListener("click", async () => {
        try {
          await unregisterParticipant(activityName, email);
        } catch (error) {
          showMessage(error.message, "error");
        }
      });
      item.appendChild(button);
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }

  function renderActivity(name, details) {
    const card = document.createElement("div");
    card.className = "activity-card";
    card.appendChild(createTextElement("h4", name));
    card.appendChild(createTextElement("p", details.description));
    card.appendChild(createTextElement("p", `Schedule: ${details.schedule}`));
    const spotsLeft = details.max_participants - details.participants.length;
    card.appendChild(createTextElement("p", `Availability: ${spotsLeft} spots left`));
    card.appendChild(createParticipantList(name, details.participants));
    activitiesList.appendChild(card);

    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    activitySelect.appendChild(option);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Unable to load activities");
      }
      const activities = await response.json();
      activitiesList.replaceChildren();
      activitySelect.replaceChildren(new Option("-- Select an activity --", ""));
      Object.entries(activities).forEach(([name, details]) => renderActivity(name, details));
    } catch (error) {
      activitiesList.replaceChildren(
        createTextElement("p", "Failed to load activities. Please try again later.")
      );
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = activitySelect.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Unable to sign up");
      }
      showMessage(result.message, "success");
      signupForm.reset();
      await fetchActivities();
    } catch (error) {
      showMessage(error.message || "Failed to sign up. Please try again.", "error");
    }
  });

  fetchActivities();
});
