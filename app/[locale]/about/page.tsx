import AuthorPage from "@/components/author/AuthorPage";
import {fetchAuthorInfo} from "@/services/db/author/fetchAuthorInfo";

const About = async () => {
  const data = await fetchAuthorInfo();

  const authorData = data.data;

  return (
    <AuthorPage authorData={authorData}/>
  )
};

export default About;
