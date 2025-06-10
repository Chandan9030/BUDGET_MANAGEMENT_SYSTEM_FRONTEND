import { v4 as uuidv4 } from "uuid"
import type { ProjectData } from "../types/project"

export const initialProjectData: ProjectData = {
  items: [
    {
      id: uuidv4(),
      srNo: 1,
      projectName: "ATS Project Web",
      status: "Completed, In Progress, On Hold", // status: "Completed",
      dev: 360000,
      extra: 0,
      invest: 1,
      gettingAmount: 1,
      yetToBeRecovered: 359999,
    },
    {
      id: uuidv4(),
      srNo: 2,
      projectName: "SOLP Project Web",
      status: "Completed, In Progress, On Hold", // status: "Completed",
      dev: 360000,
      extra: 22000,
      invest: 1,
      gettingAmount: 2000,
      yetToBeRecovered: 380000,
    },
  ],
}
